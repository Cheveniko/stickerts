import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export type Country = Doc<"countries">;

export const listCountries = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("countries").withIndex("by_name").take(100);
  },
});

export const getCountryByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("countries")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
  },
});
