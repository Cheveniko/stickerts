import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const stickerTypeValidator = v.union(
  v.literal("player"),
  v.literal("emblem"),
  v.literal("squad"),
  v.literal("intro"),
  v.literal("history"),
  v.literal("unknown"),
);

const listingStatusValidator = v.union(
  v.literal("active"),
  v.literal("paused"),
  v.literal("sold_out"),
  v.literal("removed"),
);

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    isSeller: v.boolean(),
    sellerActivatedAt: v.optional(v.number()),
    sellerPaymentId: v.optional(v.string()),
  }).index("by_tokenIdentifier", ["tokenIdentifier"]),

  countries: defineTable({
    code: v.string(),
    name: v.string(),
    currency: v.string(),
    currencySymbol: v.string(),
    flagEmoji: v.string(),
  })
    .index("by_code", ["code"])
    .index("by_name", ["name"]),

  cities: defineTable({
    countryId: v.id("countries"),
    countryCode: v.string(),
    name: v.string(),
    slug: v.string(),
  })
    .index("by_countryId_and_name", ["countryId", "name"])
    .index("by_countryCode_and_slug", ["countryCode", "slug"]),

  stickers: defineTable({
    code: v.string(),
    label: v.string(),
    section: v.string(),
    type: stickerTypeValidator,
    stickerNumber: v.number(),
    albumPage: v.number(),
    isActive: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_section", ["section"])
    .index("by_type", ["type"])
    .index("by_albumPage", ["albumPage"])
    .index("by_isActive", ["isActive"]),

  listings: defineTable({
    stickerId: v.id("stickers"),
    sellerId: v.id("sellers"),
    countryId: v.id("countries"),
    countryCode: v.string(),
    cityId: v.id("cities"),
    cityName: v.string(),
    priceCents: v.number(),
    currency: v.string(),
    imageUrl: v.string(),
    quantityAvailable: v.number(),
    quantitySold: v.number(),
    status: listingStatusValidator,
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_stickerId_and_status", ["stickerId", "status"])
    .index("by_countryId_and_status", ["countryId", "status"])
    .index("by_cityId_and_status", ["cityId", "status"])
    .index("by_countryId_and_status_and_stickerId", [
      "countryId",
      "status",
      "stickerId",
    ])
    .index("by_cityId_and_status_and_stickerId", [
      "cityId",
      "status",
      "stickerId",
    ])
    .index("by_sellerId_and_status", ["sellerId", "status"]),

  sales: defineTable({
    listingId: v.id("listings"),
    stickerId: v.id("stickers"),
    stickerCode: v.string(),
    sellerId: v.id("users"),
    quantity: v.number(),
    unitPriceCents: v.number(),
    totalPriceCents: v.number(),
    currency: v.string(),
    soldAt: v.number(),
  })
    .index("by_soldAt", ["soldAt"])
    .index("by_listingId_and_soldAt", ["listingId", "soldAt"])
    .index("by_stickerId_and_soldAt", ["stickerId", "soldAt"])
    .index("by_stickerCode_and_soldAt", ["stickerCode", "soldAt"])
    .index("by_sellerId_and_soldAt", ["sellerId", "soldAt"]),
});
