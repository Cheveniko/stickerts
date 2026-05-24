import stickersJson from "../lib/assets/stickers.json";

import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx } from "./_generated/server";
import { locationSeed } from "./locationSeed";

const listingStatuses = ["active", "paused", "sold_out", "removed"] as const;

type ListingStatus = (typeof listingStatuses)[number];

type StickerType =
  | "player"
  | "emblem"
  | "squad"
  | "intro"
  | "history"
  | "unknown";

type StickerSeedEntry = {
  code: string;
  label: string;
  section: string;
  type: StickerType;
  sticker_number: number;
  album_page: number;
};

type SeedSeller = {
  email: string;
  name: string;
  displayName: string;
  slug: string;
  avatarUrl: string;
  bio: string;
};

type SeedListing = {
  sellerSlug: string;
  countryCode: string;
  citySlug: string;
  priceCents: number;
  quantityAvailable: number;
};

type SeedLocationsResult = {
  countriesCreated: number;
  countriesUpdated: number;
  citiesCreated: number;
  citiesUpdated: number;
};

type SeedStickersResult = {
  created: number;
  updated: number;
  deactivated: number;
  totalInSeed: number;
};

type SeedListingsResult = {
  listingsCreated: number;
  listingsUpdated: number;
  sellersCreated: number;
  sellersUpdated: number;
  stickerSeedResult: SeedStickersResult;
  totalSeedListings: number;
  usersCreated: number;
  usersUpdated: number;
};

const stickerSeed = stickersJson as StickerSeedEntry[];

const validStickerTypes = new Set<StickerType>([
  "player",
  "emblem",
  "squad",
  "intro",
  "history",
  "unknown",
]);

const seedSellers: SeedSeller[] = [
  {
    email: "ana@stickerts.dev",
    name: "Ana Perez",
    displayName: "Ana Perez",
    slug: "ana-perez",
    avatarUrl: "https://placehold.co/128x128/png?text=AP",
    bio: "Coleccionista enfocada en cambios rapidos y envios seguros.",
  },
  {
    email: "diego@stickerts.dev",
    name: "Diego Mora",
    displayName: "Diego Mora",
    slug: "diego-mora",
    avatarUrl: "https://placehold.co/128x128/png?text=DM",
    bio: "Vendedor activo con cromos repetidos en excelente estado.",
  },
  {
    email: "lucia@stickerts.dev",
    name: "Lucia Vega",
    displayName: "Lucia Vega",
    slug: "lucia-vega",
    avatarUrl: "https://placehold.co/128x128/png?text=LV",
    bio: "Intercambios constantes para completar albumes rapido.",
  },
];

const seedListingEntries: SeedListing[] = [
  {
    sellerSlug: "ana-perez",
    countryCode: "EC",
    citySlug: "quito",
    priceCents: 125,
    quantityAvailable: 3,
  },
  {
    sellerSlug: "diego-mora",
    countryCode: "AR",
    citySlug: "buenos-aires",
    priceCents: 140,
    quantityAvailable: 2,
  },
  {
    sellerSlug: "lucia-vega",
    countryCode: "BR",
    citySlug: "sao-paulo",
    priceCents: 150,
    quantityAvailable: 4,
  },
  {
    sellerSlug: "ana-perez",
    countryCode: "CL",
    citySlug: "santiago",
    priceCents: 160,
    quantityAvailable: 1,
  },
  {
    sellerSlug: "diego-mora",
    countryCode: "CO",
    citySlug: "bogota",
    priceCents: 135,
    quantityAvailable: 5,
  },
  {
    sellerSlug: "lucia-vega",
    countryCode: "ES",
    citySlug: "madrid",
    priceCents: 210,
    quantityAvailable: 2,
  },
  {
    sellerSlug: "ana-perez",
    countryCode: "MX",
    citySlug: "ciudad-de-mexico",
    priceCents: 175,
    quantityAvailable: 3,
  },
  {
    sellerSlug: "diego-mora",
    countryCode: "PA",
    citySlug: "ciudad-de-panama",
    priceCents: 145,
    quantityAvailable: 2,
  },
  {
    sellerSlug: "lucia-vega",
    countryCode: "PE",
    citySlug: "lima",
    priceCents: 155,
    quantityAvailable: 3,
  },
  {
    sellerSlug: "ana-perez",
    countryCode: "US",
    citySlug: "miami",
    priceCents: 240,
    quantityAvailable: 1,
  },
];

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function seedLocationsIntoDb(
  ctx: MutationCtx,
): Promise<SeedLocationsResult> {
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

    if (existingCountry) {
      await ctx.db.patch(existingCountry._id, countryFields);
      countriesUpdated += 1;
    } else {
      await ctx.db.insert("countries", countryFields);
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
}

async function seedStickersIntoDb(
  ctx: MutationCtx,
): Promise<SeedStickersResult> {
  const now = Date.now();
  const existingStickers = await ctx.db
    .query("stickers")
    .withIndex("by_code")
    .take(2000);
  const existingByCode = new Map(
    existingStickers.map((sticker) => [sticker.code, sticker]),
  );
  const seedCodes = new Set<string>();

  let created = 0;
  let updated = 0;
  let deactivated = 0;

  for (const sticker of stickerSeed) {
    if (!validStickerTypes.has(sticker.type)) {
      throw new Error(
        `Unsupported sticker type for ${sticker.code}: ${sticker.type}`,
      );
    }

    seedCodes.add(sticker.code);

    const stickerFields = {
      code: sticker.code,
      label: sticker.label,
      section: sticker.section,
      type: sticker.type,
      stickerNumber: sticker.sticker_number,
      albumPage: sticker.album_page,
      isActive: true,
      updatedAt: now,
    };

    const existingSticker = existingByCode.get(sticker.code);

    if (existingSticker) {
      await ctx.db.patch(existingSticker._id, stickerFields);
      updated += 1;
    } else {
      await ctx.db.insert("stickers", stickerFields);
      created += 1;
    }
  }

  for (const existingSticker of existingStickers) {
    if (!seedCodes.has(existingSticker.code) && existingSticker.isActive) {
      await ctx.db.patch(existingSticker._id, {
        isActive: false,
        updatedAt: now,
      });
      deactivated += 1;
    }
  }

  return {
    created,
    updated,
    deactivated,
    totalInSeed: stickerSeed.length,
  };
}

async function upsertSeedUser(
  ctx: MutationCtx,
  seller: SeedSeller,
): Promise<{ userId: Id<"users">; created: boolean }> {
  const existingUser = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", seller.email))
    .unique();

  const userFields = {
    email: seller.email,
    image: seller.avatarUrl,
    name: seller.name,
  };

  if (existingUser) {
    await ctx.db.patch(existingUser._id, userFields);
    return { userId: existingUser._id, created: false };
  }

  const userId = await ctx.db.insert("users", userFields);
  return { userId, created: true };
}

async function upsertSeedSeller(
  ctx: MutationCtx,
  seller: SeedSeller,
  userId: Id<"users">,
  now: number,
): Promise<{ sellerId: Id<"sellers">; created: boolean }> {
  const existingSeller = await ctx.db
    .query("sellers")
    .withIndex("by_slug", (q) => q.eq("slug", seller.slug))
    .unique();

  const sellerFields = {
    userId,
    status: "active" as const,
    activatedAt: existingSeller?.activatedAt ?? now,
    displayName: seller.displayName,
    slug: seller.slug,
    avatarUrl: seller.avatarUrl,
    bio: seller.bio,
    totalSalesCount: 0,
    totalStickersSold: 0,
    totalRevenueCents: 0,
    activeListingsCount: 0,
  };

  if (existingSeller) {
    await ctx.db.patch(existingSeller._id, sellerFields);
    return { sellerId: existingSeller._id, created: false };
  }

  const sellerId = await ctx.db.insert("sellers", sellerFields);
  return { sellerId, created: true };
}

async function loadListingsBySeller(
  ctx: MutationCtx,
  sellerId: Id<"sellers">,
): Promise<Map<string, Doc<"listings">>> {
  const listingsByKey = new Map<string, Doc<"listings">>();

  for (const status of listingStatuses) {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_sellerId_and_status", (q) =>
        q.eq("sellerId", sellerId).eq("status", status),
      )
      .take(100);

    for (const listing of listings) {
      listingsByKey.set(`${listing.stickerId}:${listing.cityId}`, listing);
    }
  }

  return listingsByKey;
}

export const seedLocations = internalMutation({
  args: {},
  handler: async (ctx): Promise<SeedLocationsResult> => {
    return await seedLocationsIntoDb(ctx);
  },
});

export const seedStickers = internalMutation({
  args: {},
  handler: async (ctx): Promise<SeedStickersResult> => {
    return await seedStickersIntoDb(ctx);
  },
});

export const seedListings = internalMutation({
  args: {},
  handler: async (ctx): Promise<SeedListingsResult> => {
    const now = Date.now();
    const stickerSeedResult = await seedStickersIntoDb(ctx);

    const [countries, cities, activeStickers] = await Promise.all([
      ctx.db.query("countries").withIndex("by_name").take(100),
      ctx.db.query("cities").withIndex("by_countryCode_and_name").take(500),
      ctx.db
        .query("stickers")
        .withIndex("by_isActive", (q) => q.eq("isActive", true))
        .take(seedListingEntries.length),
    ]);

    if (countries.length === 0 || cities.length === 0) {
      throw new Error("Seed locations first before seeding listings.");
    }

    if (activeStickers.length < seedListingEntries.length) {
      throw new Error("Not enough active stickers to seed listings.");
    }

    const countryByCode = new Map(
      countries.map((country) => [country.code, country]),
    );
    const cityByLocation = new Map(
      cities.map((city) => [`${city.countryCode}:${city.slug}`, city]),
    );

    let usersCreated = 0;
    let usersUpdated = 0;
    let sellersCreated = 0;
    let sellersUpdated = 0;

    const sellerIdBySlug = new Map<string, Id<"sellers">>();

    for (const seller of seedSellers) {
      const userResult = await upsertSeedUser(ctx, seller);

      if (userResult.created) {
        usersCreated += 1;
      } else {
        usersUpdated += 1;
      }

      const sellerResult = await upsertSeedSeller(
        ctx,
        seller,
        userResult.userId,
        now,
      );

      if (sellerResult.created) {
        sellersCreated += 1;
      } else {
        sellersUpdated += 1;
      }

      sellerIdBySlug.set(seller.slug, sellerResult.sellerId);
    }

    const existingListingsBySeller = new Map<
      string,
      Map<string, Doc<"listings">>
    >();

    for (const seller of seedSellers) {
      const sellerId = sellerIdBySlug.get(seller.slug);

      if (!sellerId) {
        throw new Error(`Missing seeded seller for slug ${seller.slug}.`);
      }

      existingListingsBySeller.set(
        seller.slug,
        await loadListingsBySeller(ctx, sellerId),
      );
    }

    let listingsCreated = 0;
    let listingsUpdated = 0;
    const activeListingCountBySeller = new Map<Id<"sellers">, number>();

    for (const [index, listingSeed] of seedListingEntries.entries()) {
      const sellerId = sellerIdBySlug.get(listingSeed.sellerSlug);
      const country = countryByCode.get(listingSeed.countryCode);
      const city = cityByLocation.get(
        `${listingSeed.countryCode}:${listingSeed.citySlug}`,
      );
      const sticker = activeStickers[index];

      if (!sellerId) {
        throw new Error(`Missing seller ${listingSeed.sellerSlug}.`);
      }

      if (!country) {
        throw new Error(`Missing country ${listingSeed.countryCode}.`);
      }

      if (!city) {
        throw new Error(
          `Missing city ${listingSeed.citySlug} for country ${listingSeed.countryCode}.`,
        );
      }

      const listingFields = {
        stickerId: sticker._id,
        sellerId,
        countryCode: listingSeed.countryCode,
        cityId: city._id,
        cityName: city.name,
        priceCents: listingSeed.priceCents,
        currency: country.currency,
        imageUrl: `https://placehold.co/600x600/png?text=${sticker.code}`,
        quantityAvailable: listingSeed.quantityAvailable,
        quantitySold: 0,
        status: "active" as ListingStatus,
        updatedAt: now,
      };

      const listingKey = `${sticker._id}:${city._id}`;
      const existingListing = existingListingsBySeller
        .get(listingSeed.sellerSlug)
        ?.get(listingKey);

      if (existingListing) {
        await ctx.db.patch(existingListing._id, listingFields);
        listingsUpdated += 1;
      } else {
        await ctx.db.insert("listings", listingFields);
        listingsCreated += 1;
      }

      activeListingCountBySeller.set(
        sellerId,
        (activeListingCountBySeller.get(sellerId) ?? 0) + 1,
      );
    }

    for (const seller of seedSellers) {
      const sellerId = sellerIdBySlug.get(seller.slug);

      if (!sellerId) {
        continue;
      }

      await ctx.db.patch(sellerId, {
        activeListingsCount: activeListingCountBySeller.get(sellerId) ?? 0,
        totalSalesCount: 0,
        totalStickersSold: 0,
        totalRevenueCents: 0,
        status: "active",
      });
    }

    return {
      listingsCreated,
      listingsUpdated,
      sellersCreated,
      sellersUpdated,
      stickerSeedResult,
      totalSeedListings: seedListingEntries.length,
      usersCreated,
      usersUpdated,
    };
  },
});
