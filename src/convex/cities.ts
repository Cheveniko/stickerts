import { v } from "convex/values";
import { internalMutation, query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { locationSeed, toLocationSlug } from "../lib/location-data";

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

export const syncLocationSeed = internalMutation({
  args: {},
  handler: async (ctx) => {
    let created = 0;
    let updated = 0;

    for (const country of locationSeed) {
      for (const cityName of country.cities) {
        const slug = toLocationSlug(cityName);
        const existingCity = await ctx.db
          .query("cities")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .unique();

        const cityFields = {
          countryCode: country.code,
          countryName: country.name,
          currency: country.currency,
          currencySymbol: country.currencySymbol,
          flagEmoji: country.flagEmoji,
          name: cityName,
          slug,
        };

        if (existingCity) {
          await ctx.db.patch(existingCity._id, cityFields);
          updated += 1;
        } else {
          await ctx.db.insert("cities", cityFields);
          created += 1;
        }
      }
    }

    return { created, updated, total: created + updated };
  },
});
