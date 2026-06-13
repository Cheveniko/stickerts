import { ConvexError, v } from "convex/values";
import { requireAuthUserId } from "./authHelpers";
import type { Doc } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { t } from "./messages";
import { getCityBySlug, type City } from "./cities";
import { requireCurrentSeller, type Seller } from "./sellers";
import type { Sticker } from "./stickers";
import type { Listing } from "./listings";

export type Sale = Doc<"sales">;

export type RecentPublicSale = Sale & {
  city: City;
  listing: Listing;
  sticker: Sticker;
};

export type SellerSaleForSettings = RecentPublicSale;

type SalesDbCtx = Pick<QueryCtx, "db">;
type SalesMutationDbCtx = Pick<MutationCtx, "db">;

function normalizeSaleQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new ConvexError({
      code: "INVALID_QUANTITY",
      message: t(undefined, "error_invalid_quantity"),
    });
  }

  return quantity;
}

function normalizeUnitPriceCents(unitPriceCents: number) {
  if (!Number.isInteger(unitPriceCents) || unitPriceCents <= 0) {
    throw new ConvexError({
      code: "INVALID_PRICE",
      message: t(undefined, "error_invalid_price"),
    });
  }

  return unitPriceCents;
}

async function requireOwnedListing(
  ctx: SalesDbCtx,
  listingId: Doc<"listings">["_id"],
  sellerId: Seller["_id"],
) {
  const listing = await ctx.db.get(listingId);

  if (!listing || listing.sellerId !== sellerId) {
    throw new ConvexError({
      code: "LISTING_NOT_FOUND",
      message: t(undefined, "error_listing_not_found"),
    });
  }

  return listing;
}

async function enrichSaleWithPublicRelations(
  ctx: QueryCtx,
  sale: Sale,
): Promise<RecentPublicSale> {
  const [listing, sticker] = await Promise.all([
    ctx.db.get(sale.listingId),
    ctx.db.get(sale.stickerId),
  ]);

  if (!listing || !sticker) {
    throw new Error(`Sale ${sale._id} is missing required relations`);
  }

  const city = await getCityBySlug(ctx, listing.citySlug);

  if (!city) {
    throw new Error(`Sale ${sale._id} is missing listing city`);
  }

  return {
    ...sale,
    city,
    listing,
    sticker,
  };
}

export const recordCurrentSellerSale = mutation({
  args: {
    listingId: v.id("listings"),
    quantity: v.number(),
    unitPriceCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthUserId(ctx);
    const seller = await requireCurrentSeller(ctx, userId);
    const listing = await requireOwnedListing(ctx, args.listingId, seller._id);
    const sticker = await ctx.db.get(listing.stickerId);

    if (!sticker) {
      throw new Error(`Listing ${listing._id} is missing sticker relation`);
    }

    if (listing.status === "removed") {
      throw new ConvexError({
        code: "LISTING_REMOVED",
        message: t(undefined, "error_listing_removed"),
      });
    }

    if (listing.intent === "trade") {
      throw new ConvexError({
        code: "LISTING_NOT_FOR_SALE",
        message: t(undefined, "error_sale_listing_not_for_sale"),
      });
    }

    const quantity = normalizeSaleQuantity(args.quantity);

    if (quantity > listing.quantityAvailable) {
      throw new ConvexError({
        code: "SALE_QUANTITY_UNAVAILABLE",
        message: t(undefined, "error_sale_quantity_unavailable"),
      });
    }

    const baseUnitPriceCents = args.unitPriceCents ?? listing.priceCents;
    const currency = listing.currency;

    if (baseUnitPriceCents === undefined || currency === undefined) {
      throw new ConvexError({
        code: "LISTING_NOT_FOR_SALE",
        message: t(undefined, "error_sale_listing_not_for_sale"),
      });
    }

    const unitPriceCents = normalizeUnitPriceCents(baseUnitPriceCents);
    const totalPriceCents = unitPriceCents * quantity;
    const nextQuantityAvailable = listing.quantityAvailable - quantity;
    const nextQuantitySold = listing.quantitySold + quantity;
    const soldAt = Date.now();
    const nextStatus =
      nextQuantityAvailable === 0 ? "sold_out" : listing.status;

    const saleId = await ctx.db.insert("sales", {
      listingId: listing._id,
      stickerId: listing.stickerId,
      stickerCode: sticker.code,
      sellerId: seller._id,
      quantity,
      unitPriceCents,
      totalPriceCents,
      currency,
      soldAt,
    });

    await ctx.db.patch(listing._id, {
      quantityAvailable: nextQuantityAvailable,
      quantitySold: nextQuantitySold,
      status: nextStatus,
      updatedAt: soldAt,
    });

    await ctx.db.patch(seller._id, {
      totalSalesCount: seller.totalSalesCount + 1,
      totalStickersSold: seller.totalStickersSold + quantity,
      totalRevenueCents: seller.totalRevenueCents + totalPriceCents,
      lastSoldAt: soldAt,
    });

    return saleId;
  },
});

export const getCurrentSellerSalesForSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthUserId(ctx);
    const seller = await requireCurrentSeller(ctx, userId);
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_sellerId_and_soldAt", (q) => q.eq("sellerId", seller._id))
      .order("desc")
      .collect();

    return await Promise.all(
      sales.map((sale) => enrichSaleWithPublicRelations(ctx, sale)),
    );
  },
});

export const getRecentPublicSales = query({
  args: {},
  handler: async (ctx) => {
    const sales = await ctx.db
      .query("sales")
      .withIndex("by_soldAt")
      .order("desc")
      .take(12);

    return await Promise.all(
      sales.map((sale) => enrichSaleWithPublicRelations(ctx, sale)),
    );
  },
});
