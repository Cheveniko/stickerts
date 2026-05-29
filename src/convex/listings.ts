import { ConvexError, v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
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

export type SellerListingForSettings = ListingWithRelations & {
  wantedStickerIds: Sticker["_id"][];
  wantedStickers: Sticker[];
};

type ListingWriteArgs = {
  citySlug: Listing["citySlug"];
  currency?: Listing["currency"];
  imageKey: Listing["imageKey"];
  intent: Listing["intent"];
  priceCents?: Listing["priceCents"];
  quantityAvailable: Listing["quantityAvailable"];
  tradeDescription?: Listing["tradeDescription"];
  wantedStickerIds?: Sticker["_id"][];
};

type PreparedListingWriteData = {
  citySlug: Listing["citySlug"];
  currency: Listing["currency"];
  imageKey: Listing["imageKey"];
  intent: Listing["intent"];
  priceCents: Listing["priceCents"];
  quantityAvailable: Listing["quantityAvailable"];
  tradeDescription: Listing["tradeDescription"];
  wantedStickerIds: Sticker["_id"][];
};

type ListingDbCtx = Pick<QueryCtx, "db">;
type ListingMutationDbCtx = Pick<MutationCtx, "db">;

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

async function requireOwnedListing(
  ctx: ListingDbCtx,
  listingId: Listing["_id"],
  sellerId: Seller["_id"],
) {
  const listing = await ctx.db.get(listingId);

  if (!listing || listing.sellerId !== sellerId) {
    throw new ConvexError({
      code: "LISTING_NOT_FOUND",
      message: "No encontramos la publicacion seleccionada.",
    });
  }

  return listing;
}

async function prepareListingWriteData(
  ctx: ListingDbCtx,
  seller: Seller,
  args: ListingWriteArgs,
): Promise<PreparedListingWriteData> {
  const city = await getCityBySlug(ctx, args.citySlug);

  if (!city) {
    throw new ConvexError({
      code: "CITY_NOT_FOUND",
      message: "No encontramos la ciudad seleccionada.",
    });
  }

  const isForSale = args.intent === "sale" || args.intent === "sale_or_trade";
  const isForTrade = args.intent === "trade" || args.intent === "sale_or_trade";
  const quantityAvailable = normalizeQuantityAvailable(args.quantityAvailable);
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

  return {
    citySlug: city.slug,
    currency,
    imageKey: args.imageKey,
    intent: args.intent,
    priceCents,
    quantityAvailable,
    tradeDescription,
    wantedStickerIds,
  };
}

async function replaceListingTradeWants(
  ctx: ListingMutationDbCtx,
  listingId: Listing["_id"],
  wantedStickerIds: Sticker["_id"][],
) {
  const existingTradeWants = await ctx.db
    .query("listingTradeWants")
    .withIndex("by_listingId", (q) => q.eq("listingId", listingId))
    .collect();

  for (const listingTradeWant of existingTradeWants) {
    await ctx.db.delete(listingTradeWant._id);
  }

  for (const wantedStickerId of wantedStickerIds) {
    await ctx.db.insert("listingTradeWants", {
      listingId,
      wantedStickerId,
    });
  }
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

async function getListingWantedStickers(
  ctx: QueryCtx,
  listingId: Listing["_id"],
): Promise<
  Pick<SellerListingForSettings, "wantedStickerIds" | "wantedStickers">
> {
  const listingTradeWants = await ctx.db
    .query("listingTradeWants")
    .withIndex("by_listingId", (q) => q.eq("listingId", listingId))
    .collect();

  const wantedStickerIds = listingTradeWants.map(
    (listingTradeWant) => listingTradeWant.wantedStickerId,
  );

  if (wantedStickerIds.length === 0) {
    return { wantedStickerIds, wantedStickers: [] };
  }

  const wantedStickers = await Promise.all(
    wantedStickerIds.map((wantedStickerId) => ctx.db.get(wantedStickerId)),
  );

  if (wantedStickers.some((wantedSticker) => !wantedSticker)) {
    throw new Error(`Listing ${listingId} is missing wanted stickers`);
  }

  return {
    wantedStickerIds,
    wantedStickers: wantedStickers as Sticker[],
  };
}

async function enrichSellerListingForSettings(
  ctx: QueryCtx,
  listing: Listing,
): Promise<SellerListingForSettings> {
  const [listingWithRelations, tradeWants] = await Promise.all([
    enrichListing(ctx, listing),
    getListingWantedStickers(ctx, listing._id),
  ]);

  return {
    ...listingWithRelations,
    ...tradeWants,
  };
}

export const getActiveListingsWithDetails = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_status_and_priceCents", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    return Promise.all(listings.map((listing) => enrichListing(ctx, listing)));
  },
});

export const getCurrentSellerListingsForSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
    const seller = await requireCurrentSeller(ctx, userId);
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_sellerId_and_updatedAt", (q) =>
        q.eq("sellerId", seller._id),
      )
      .order("desc")
      .collect();

    return await Promise.all(
      listings
        .filter((listing) => listing.status !== "removed")
        .map((listing) => enrichSellerListingForSettings(ctx, listing)),
    );
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

    const sticker = await ctx.db.get(args.stickerId);

    if (!sticker || !sticker.isActive) {
      throw new ConvexError({
        code: "STICKER_NOT_FOUND",
        message: "No encontramos el cromo seleccionado.",
      });
    }

    const preparedListing = await prepareListingWriteData(ctx, seller, args);

    const listingId = await ctx.db.insert("listings", {
      stickerId: args.stickerId,
      sellerId: seller._id,
      citySlug: preparedListing.citySlug,
      intent: preparedListing.intent,
      currency: preparedListing.currency,
      imageKey: preparedListing.imageKey,
      priceCents: preparedListing.priceCents,
      quantityAvailable: preparedListing.quantityAvailable,
      quantitySold: 0,
      status: "active",
      tradeDescription: preparedListing.tradeDescription,
      updatedAt: Date.now(),
    });

    await replaceListingTradeWants(
      ctx,
      listingId,
      preparedListing.wantedStickerIds,
    );

    return listingId;
  },
});

export const updateCurrentSellerListing = mutation({
  args: {
    listingId: v.id("listings"),
    citySlug: v.string(),
    currency: v.optional(v.string()),
    imageKey: v.string(),
    intent: listingIntentValidator,
    isSoldOut: v.boolean(),
    priceCents: v.optional(v.number()),
    quantityAvailable: v.number(),
    tradeDescription: v.optional(v.string()),
    wantedStickerIds: v.optional(v.array(v.id("stickers"))),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const seller = await requireCurrentSeller(ctx, userId);
    const listing = await requireOwnedListing(ctx, args.listingId, seller._id);

    if (listing.status === "removed") {
      throw new ConvexError({
        code: "LISTING_REMOVED",
        message: "Esta publicacion ya no se puede editar.",
      });
    }

    const preparedListing = await prepareListingWriteData(ctx, seller, args);

    await replaceListingTradeWants(
      ctx,
      listing._id,
      preparedListing.wantedStickerIds,
    );

    await ctx.db.patch(listing._id, {
      citySlug: preparedListing.citySlug,
      currency: preparedListing.currency,
      imageKey: preparedListing.imageKey,
      intent: preparedListing.intent,
      priceCents: preparedListing.priceCents,
      quantityAvailable: preparedListing.quantityAvailable,
      status: args.isSoldOut ? "sold_out" : "active",
      tradeDescription: preparedListing.tradeDescription,
      updatedAt: Date.now(),
    });

    return listing._id;
  },
});

export const removeCurrentSellerListing = mutation({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const seller = await requireCurrentSeller(ctx, userId);
    const listing = await requireOwnedListing(ctx, args.listingId, seller._id);

    if (listing.status === "removed") {
      return listing._id;
    }

    await ctx.db.patch(listing._id, {
      status: "removed",
      updatedAt: Date.now(),
    });

    return listing._id;
  },
});
