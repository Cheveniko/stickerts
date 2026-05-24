import { v } from "convex/values";

import { query } from "./_generated/server";

export const listActiveStickers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("stickers")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .take(2000);
  },
});

export const getStickerByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stickers")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
  },
});
