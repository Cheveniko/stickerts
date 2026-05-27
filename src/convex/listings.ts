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
    currency: v.string(),
    imageKey: v.string(),
    priceCents: v.number(),
    quantityAvailable: v.number(),
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

    const priceCents = normalizePriceCents(args.priceCents);
    const quantityAvailable = normalizeQuantityAvailable(
      args.quantityAvailable,
    );
    const currency = normalizeCurrency(args.currency);
    const imageKeyPrefix = `listings/${seller._id}/`;

    if (!args.imageKey.startsWith(imageKeyPrefix)) {
      throw new ConvexError({
        code: "INVALID_IMAGE_KEY",
        message: "La imagen seleccionada no pertenece a este seller.",
      });
    }

    return await ctx.db.insert("listings", {
      stickerId: args.stickerId,
      sellerId: seller._id,
      citySlug: city.slug,
      currency,
      imageKey: args.imageKey,
      priceCents,
      quantityAvailable,
      quantitySold: 0,
      status: "active",
      updatedAt: Date.now(),
    });
  },
});
