import { v } from "convex/values";

import { internalMutation, query } from "./_generated/server";
import { locationSeed } from "./locationSeed";

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const seedLocations = internalMutation({
  args: {},
  handler: async (ctx) => {
    let countriesCreated = 0;
    let countriesUpdated = 0;
    let citiesCreated = 0;
    let citiesUpdated = 0;

    for (const country of locationSeed) {
      const existingCountry = await ctx.db
        .query("countries")
        .withIndex("by_code", (q) => q.eq("code", country.code))
        .unique();

      const countryFields = {
        code: country.code,
        name: country.name,
        currency: country.currency,
        currencySymbol: country.currencySymbol,
        flagEmoji: country.flagEmoji,
      };

      let countryId = existingCountry?._id;

      if (countryId) {
        await ctx.db.patch(countryId, countryFields);
        countriesUpdated += 1;
      } else {
        countryId = await ctx.db.insert("countries", countryFields);
        countriesCreated += 1;
      }

      for (const cityName of country.cities) {
        const slug = toSlug(cityName);
        const existingCity = await ctx.db
          .query("cities")
          .withIndex("by_countryCode_and_slug", (q) =>
            q.eq("countryCode", country.code).eq("slug", slug),
          )
          .unique();

        const cityFields = {
          countryId,
          countryCode: country.code,
          name: cityName,
          slug,
        };

        if (existingCity) {
          await ctx.db.patch(existingCity._id, cityFields);
          citiesUpdated += 1;
        } else {
          await ctx.db.insert("cities", cityFields);
          citiesCreated += 1;
        }
      }
    }

    return {
      countriesCreated,
      countriesUpdated,
      citiesCreated,
      citiesUpdated,
    };
  },
});

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
    const country = await ctx.db
      .query("countries")
      .withIndex("by_code", (q) => q.eq("code", args.countryCode))
      .unique();

    if (!country) {
      return [];
    }

    return await ctx.db
      .query("cities")
      .withIndex("by_countryId_and_name", (q) => q.eq("countryId", country._id))
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
