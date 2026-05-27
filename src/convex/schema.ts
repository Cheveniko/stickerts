import { authTables } from "@convex-dev/auth/server";
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

const sellerStatusValidator = v.union(
  v.literal("active"),
  v.literal("paused"),
  v.literal("blocked"),
);

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.string(),
    image: v.optional(v.string()),
    email: v.string(),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  sellers: defineTable({
    userId: v.id("users"),
    status: sellerStatusValidator,
    activatedAt: v.number(),
    defaultCitySlug: v.optional(v.string()),
    defaultCurrency: v.optional(v.string()),
    paymentId: v.optional(v.string()),
    username: v.string(),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    totalSalesCount: v.number(),
    totalStickersSold: v.number(),
    totalRevenueCents: v.number(),
    activeListingsCount: v.number(),
    lastSoldAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_username", ["username"])
    .index("by_status", ["status"]),

  cities: defineTable({
    countryCode: v.string(),
    countryName: v.string(),
    currency: v.string(),
    currencySymbol: v.string(),
    flagEmoji: v.string(),
    name: v.string(),
    slug: v.string(),
  })
    .index("by_countryCode_and_name", ["countryCode", "name"])
    .index("by_slug", ["slug"]),

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
    citySlug: v.string(),
    priceCents: v.number(),
    currency: v.string(),
    imageKey: v.string(),
    quantityAvailable: v.number(),
    quantitySold: v.number(),
    status: listingStatusValidator,
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_stickerId_and_status", ["stickerId", "status"])
    .index("by_citySlug_and_status", ["citySlug", "status"])
    .index("by_citySlug_and_status_and_stickerId", [
      "citySlug",
      "status",
      "stickerId",
    ])
    .index("by_sellerId_and_status", ["sellerId", "status"]),

  purchaseInquiries: defineTable({
    listingId: v.id("listings"),
    sellerId: v.id("sellers"),
    stickerId: v.id("stickers"),
    anonymousClientId: v.string(),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_listingId_and_createdAt", ["listingId", "createdAt"])
    .index("by_sellerId_and_createdAt", ["sellerId", "createdAt"])
    .index("by_anonymousClientId_and_createdAt", [
      "anonymousClientId",
      "createdAt",
    ])
    .index("by_anonymousClientId_and_listingId_and_createdAt", [
      "anonymousClientId",
      "listingId",
      "createdAt",
    ]),

  sales: defineTable({
    listingId: v.id("listings"),
    stickerId: v.id("stickers"),
    stickerCode: v.string(),
    sellerId: v.id("sellers"),
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
