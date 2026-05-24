import { v } from "convex/values";

import { query } from "./_generated/server";

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

export const listCitiesByCountryCode = query({
  args: { countryCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cities")
      .withIndex("by_countryCode_and_name", (q) =>
        q.eq("countryCode", args.countryCode),
      )
      .take(500);
  },
});

export const getCityByCountryAndSlug = query({
  args: {
    countryCode: v.string(),
    citySlug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cities")
      .withIndex("by_countryCode_and_slug", (q) =>
        q.eq("countryCode", args.countryCode).eq("slug", args.citySlug),
      )
      .unique();
  },
});
