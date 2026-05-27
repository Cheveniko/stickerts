import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

export type City = Doc<"cities">;

type CityDbCtx = Pick<QueryCtx, "db">;

export async function getCityBySlug(
  ctx: CityDbCtx,
  citySlug: City["slug"],
): Promise<City | null> {
  return await ctx.db
    .query("cities")
    .withIndex("by_slug", (q) => q.eq("slug", citySlug))
    .unique();
}

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
