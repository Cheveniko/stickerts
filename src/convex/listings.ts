import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { requireAuthUserId } from "./authHelpers";
import { getCityBySlug, type City } from "./cities";
import { requireCurrentSeller, type Seller } from "./sellers";
import type { Sticker } from "./stickers";

export type Listing = Doc<"listings">;

export type ListingWithRelations = Listing & {
  city: City;
  sticker: Sticker;
  seller: Seller;
  sellerName: string;
};

const CURRENCY_REGEX = /^[A-Z]{3}$/;

const listingIntentValidator = v.union(
  v.literal("sale"),
  v.literal("trade"),
  v.literal("sale_or_trade"),
);

function normalizeCurrency(currency: string) {
  const normalizedCurrency = currency.trim().toUpperCase();

  if (!CURRENCY_REGEX.test(normalizedCurrency)) {
    throw new ConvexError({
      code: "INVALID_CURRENCY",
      message: "La moneda debe ser un codigo ISO de 3 letras.",
    });
  }

  return normalizedCurrency;
}

function normalizePriceCents(priceCents: number) {
  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    throw new ConvexError({
      code: "INVALID_PRICE",
      message: "El precio debe ser mayor a 0.",
    });
  }

  return priceCents;
}

function normalizeQuantityAvailable(quantityAvailable: number) {
  if (!Number.isInteger(quantityAvailable) || quantityAvailable <= 0) {
    throw new ConvexError({
      code: "INVALID_QUANTITY",
      message: "La cantidad debe ser mayor a 0.",
    });
  }

  return quantityAvailable;
}

function normalizeTradeDescription(tradeDescription: string | undefined) {
  if (tradeDescription === undefined || tradeDescription === "") {
    return undefined;
  }

  return tradeDescription;
}

async function enrichListing(
  ctx: QueryCtx,
  listing: Listing,
): Promise<ListingWithRelations> {
  const [city, sticker, seller] = await Promise.all([
    getCityBySlug(ctx, listing.citySlug),
    ctx.db.get(listing.stickerId),
    ctx.db.get(listing.sellerId),
  ]);

  if (!city || !sticker || !seller) {
    throw new Error(`Listing ${listing._id} is missing required relations`);
  }

  const sellerUser = await ctx.db.get(seller.userId);

  if (!sellerUser) {
    throw new Error(`Listing ${listing._id} is missing seller user`);
  }

  return {
    ...listing,
    city,
    sticker,
    seller,
    sellerName: sellerUser.name,
  };
}

export const getActiveListingsWithDetails = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    return Promise.all(listings.map((listing) => enrichListing(ctx, listing)));
  },
});

export const createListing = mutation({
  args: {
    stickerId: v.id("stickers"),
    citySlug: v.string(),
    currency: v.optional(v.string()),
    imageKey: v.string(),
    intent: listingIntentValidator,
    priceCents: v.optional(v.number()),
    quantityAvailable: v.number(),
    tradeDescription: v.optional(v.string()),
    wantedStickerIds: v.optional(v.array(v.id("stickers"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const seller = await requireCurrentSeller(ctx, userId);

    if (seller.status !== "active") {
      throw new ConvexError({
        code: "SELLER_INACTIVE",
        message: "Tu cuenta seller no puede publicar cromos en este momento.",
      });
    }

    const [sticker, city] = await Promise.all([
      ctx.db.get(args.stickerId),
      getCityBySlug(ctx, args.citySlug),
    ]);

    if (!sticker || !sticker.isActive) {
      throw new ConvexError({
        code: "STICKER_NOT_FOUND",
        message: "No encontramos el cromo seleccionado.",
      });
    }

    if (!city) {
      throw new ConvexError({
        code: "CITY_NOT_FOUND",
        message: "No encontramos la ciudad seleccionada.",
      });
    }

    const isForSale = args.intent === "sale" || args.intent === "sale_or_trade";
    const isForTrade =
      args.intent === "trade" || args.intent === "sale_or_trade";
    const quantityAvailable = normalizeQuantityAvailable(
      args.quantityAvailable,
    );
    const tradeDescription = isForTrade
      ? normalizeTradeDescription(args.tradeDescription)
      : undefined;
    const wantedStickerIds = isForTrade
      ? [...new Set(args.wantedStickerIds ?? [])]
      : [];
    const imageKeyPrefix = `listings/${seller._id}/`;
    let priceCents: number | undefined;
    let currency: string | undefined;

    if (isForSale) {
      if (args.priceCents === undefined) {
        throw new ConvexError({
          code: "INVALID_PRICE",
          message: "Debes indicar un precio si publicas el cromo para venta.",
        });
      }

      if (!args.currency) {
        throw new ConvexError({
          code: "INVALID_CURRENCY",
          message: "Debes indicar una moneda si publicas el cromo para venta.",
        });
      }

      priceCents = normalizePriceCents(args.priceCents);
      currency = normalizeCurrency(args.currency);
    }

    if (!args.imageKey.startsWith(imageKeyPrefix)) {
      throw new ConvexError({
        code: "INVALID_IMAGE_KEY",
        message: "La imagen seleccionada no pertenece a este seller.",
      });
    }

    if (wantedStickerIds.length > 0) {
      const wantedStickers = await Promise.all(
        wantedStickerIds.map((wantedStickerId) => ctx.db.get(wantedStickerId)),
      );

      if (wantedStickers.some((wantedSticker) => !wantedSticker?.isActive)) {
        throw new ConvexError({
          code: "WANTED_STICKER_NOT_FOUND",
          message: "Uno de los cromos solicitados para intercambio no existe.",
        });
      }
    }

    const listingId = await ctx.db.insert("listings", {
      stickerId: args.stickerId,
      sellerId: seller._id,
      citySlug: city.slug,
      intent: args.intent,
      currency,
      imageKey: args.imageKey,
      priceCents,
      quantityAvailable,
      quantitySold: 0,
      status: "active",
      tradeDescription,
      updatedAt: Date.now(),
    });

    for (const wantedStickerId of wantedStickerIds) {
      await ctx.db.insert("listingTradeWants", {
        listingId,
        wantedStickerId,
      });
    }

    return listingId;
  },
});
