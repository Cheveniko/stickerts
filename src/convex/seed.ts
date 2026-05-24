import { internalMutation, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

const listingStatuses = ["active", "paused", "sold_out", "removed"] as const;

type ListingStatus = (typeof listingStatuses)[number];

type SampleSeller = {
  tokenIdentifier: string;
  name: string;
  email: string;
};

type SampleListing = {
  sellerTokenIdentifier: string;
  countryCode: string;
  citySlug: string;
  stickerCode: string;
  priceCents: number;
  quantityAvailable: number;
  quantitySold: number;
  status: ListingStatus;
  imageUrl: string;
  updatedHoursAgo: number;
};

const sampleSellers: SampleSeller[] = [
  {
    tokenIdentifier: "seed-seller-ecuador-1",
    name: "Camila Mendoza",
    email: "camila+seed@stickerts.test",
  },
  {
    tokenIdentifier: "seed-seller-colombia-1",
    name: "Andres Rojas",
    email: "andres+seed@stickerts.test",
  },
  {
    tokenIdentifier: "seed-seller-usa-1",
    name: "Sofia Ramirez",
    email: "sofia+seed@stickerts.test",
  },
  {
    tokenIdentifier: "seed-seller-spain-1",
    name: "Diego Torres",
    email: "diego+seed@stickerts.test",
  },
  {
    tokenIdentifier: "seed-seller-latam-1",
    name: "Valentina Cruz",
    email: "valentina+seed@stickerts.test",
  },
];

const sampleListings: SampleListing[] = [
  {
    sellerTokenIdentifier: "seed-seller-ecuador-1",
    countryCode: "EC",
    citySlug: "quito",
    stickerCode: "ECU-1",
    priceCents: 125,
    quantityAvailable: 3,
    quantitySold: 1,
    status: "active",
    imageUrl: "https://placehold.co/600x600/111827/FFFFFF?text=ECU-1",
    updatedHoursAgo: 6,
  },
  {
    sellerTokenIdentifier: "seed-seller-ecuador-1",
    countryCode: "EC",
    citySlug: "guayaquil",
    stickerCode: "ARG-10",
    priceCents: 175,
    quantityAvailable: 2,
    quantitySold: 0,
    status: "active",
    imageUrl: "https://placehold.co/600x600/0F766E/FFFFFF?text=ARG-10",
    updatedHoursAgo: 3,
  },
  {
    sellerTokenIdentifier: "seed-seller-colombia-1",
    countryCode: "CO",
    citySlug: "bogota",
    stickerCode: "COL-11",
    priceCents: 450000,
    quantityAvailable: 4,
    quantitySold: 2,
    status: "active",
    imageUrl: "https://placehold.co/600x600/1D4ED8/FFFFFF?text=COL-11",
    updatedHoursAgo: 12,
  },
  {
    sellerTokenIdentifier: "seed-seller-colombia-1",
    countryCode: "CO",
    citySlug: "medellin",
    stickerCode: "BRA-13",
    priceCents: 520000,
    quantityAvailable: 1,
    quantitySold: 0,
    status: "paused",
    imageUrl: "https://placehold.co/600x600/7C3AED/FFFFFF?text=BRA-13",
    updatedHoursAgo: 18,
  },
  {
    sellerTokenIdentifier: "seed-seller-usa-1",
    countryCode: "US",
    citySlug: "miami",
    stickerCode: "USA-10",
    priceCents: 299,
    quantityAvailable: 5,
    quantitySold: 3,
    status: "active",
    imageUrl: "https://placehold.co/600x600/DC2626/FFFFFF?text=USA-10",
    updatedHoursAgo: 2,
  },
  {
    sellerTokenIdentifier: "seed-seller-usa-1",
    countryCode: "US",
    citySlug: "new-york",
    stickerCode: "MEX-1",
    priceCents: 349,
    quantityAvailable: 0,
    quantitySold: 4,
    status: "sold_out",
    imageUrl: "https://placehold.co/600x600/F59E0B/111827?text=MEX-1",
    updatedHoursAgo: 24,
  },
  {
    sellerTokenIdentifier: "seed-seller-spain-1",
    countryCode: "ES",
    citySlug: "madrid",
    stickerCode: "ESP-10",
    priceCents: 260,
    quantityAvailable: 2,
    quantitySold: 1,
    status: "active",
    imageUrl: "https://placehold.co/600x600/2563EB/FFFFFF?text=ESP-10",
    updatedHoursAgo: 5,
  },
  {
    sellerTokenIdentifier: "seed-seller-spain-1",
    countryCode: "ES",
    citySlug: "barcelona",
    stickerCode: "FRA-11",
    priceCents: 310,
    quantityAvailable: 1,
    quantitySold: 0,
    status: "removed",
    imageUrl: "https://placehold.co/600x600/334155/FFFFFF?text=FRA-11",
    updatedHoursAgo: 48,
  },
  {
    sellerTokenIdentifier: "seed-seller-latam-1",
    countryCode: "MX",
    citySlug: "ciudad-de-mexico",
    stickerCode: "MEX-12",
    priceCents: 4500,
    quantityAvailable: 3,
    quantitySold: 1,
    status: "active",
    imageUrl: "https://placehold.co/600x600/166534/FFFFFF?text=MEX-12",
    updatedHoursAgo: 9,
  },
  {
    sellerTokenIdentifier: "seed-seller-latam-1",
    countryCode: "AR",
    citySlug: "buenos-aires",
    stickerCode: "ARG-11",
    priceCents: 185000,
    quantityAvailable: 2,
    quantitySold: 0,
    status: "paused",
    imageUrl: "https://placehold.co/600x600/0891B2/FFFFFF?text=ARG-11",
    updatedHoursAgo: 15,
  },
];

async function upsertSeller(
  ctx: MutationCtx,
  seller: SampleSeller,
): Promise<Id<"users">> {
  const existingSeller = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", seller.tokenIdentifier),
    )
    .unique();

  const sellerFields = {
    tokenIdentifier: seller.tokenIdentifier,
    name: seller.name,
    email: seller.email,
    isSeller: true,
    sellerActivatedAt: existingSeller?.sellerActivatedAt ?? Date.now(),
    sellerPaymentId:
      existingSeller?.sellerPaymentId ??
      `seed-payment-${seller.tokenIdentifier}`,
  };

  if (existingSeller) {
    await ctx.db.patch(existingSeller._id, sellerFields);
    return existingSeller._id;
  }

  return await ctx.db.insert("users", sellerFields);
}

async function requireCountry(ctx: MutationCtx, countryCode: string) {
  const country = await ctx.db
    .query("countries")
    .withIndex("by_code", (q) => q.eq("code", countryCode))
    .unique();

  if (!country) {
    throw new Error(
      `Country not found for code ${countryCode}. Run the locations seed first.`,
    );
  }

  return country;
}

async function requireCity(
  ctx: MutationCtx,
  countryCode: string,
  citySlug: string,
) {
  const city = await ctx.db
    .query("cities")
    .withIndex("by_countryCode_and_slug", (q) =>
      q.eq("countryCode", countryCode).eq("slug", citySlug),
    )
    .unique();

  if (!city) {
    throw new Error(
      `City not found for ${countryCode}/${citySlug}. Run the locations seed first.`,
    );
  }

  return city;
}

async function requireSticker(ctx: MutationCtx, stickerCode: string) {
  const sticker = await ctx.db
    .query("stickers")
    .withIndex("by_code", (q) => q.eq("code", stickerCode))
    .unique();

  if (!sticker) {
    throw new Error(
      `Sticker not found for code ${stickerCode}. Run the stickers seed first.`,
    );
  }

  return sticker;
}

async function findExistingSeedListing(
  ctx: MutationCtx,
  sellerId: Id<"users">,
  stickerId: Id<"stickers">,
  cityId: Id<"cities">,
): Promise<Doc<"listings"> | null> {
  const listingsByStatus = await Promise.all(
    listingStatuses.map((status) =>
      ctx.db
        .query("listings")
        .withIndex("by_sellerId_and_status", (q) =>
          q.eq("sellerId", sellerId).eq("status", status),
        )
        .take(100),
    ),
  );

  return (
    listingsByStatus
      .flat()
      .find(
        (listing) =>
          listing.stickerId === stickerId && listing.cityId === cityId,
      ) ?? null
  );
}

export const seedSampleListings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sellerIds = new Map<string, Id<"users">>();
    let sellersCreated = 0;
    let sellersUpdated = 0;
    let listingsCreated = 0;
    let listingsUpdated = 0;

    for (const seller of sampleSellers) {
      const existingSeller = await ctx.db
        .query("users")
        .withIndex("by_tokenIdentifier", (q) =>
          q.eq("tokenIdentifier", seller.tokenIdentifier),
        )
        .unique();

      const sellerId = await upsertSeller(ctx, seller);
      sellerIds.set(seller.tokenIdentifier, sellerId);

      if (existingSeller) {
        sellersUpdated += 1;
      } else {
        sellersCreated += 1;
      }
    }

    for (const sample of sampleListings) {
      const sellerId = sellerIds.get(sample.sellerTokenIdentifier);

      if (!sellerId) {
        throw new Error(
          `Seller not found for token ${sample.sellerTokenIdentifier}.`,
        );
      }

      const [country, city, sticker] = await Promise.all([
        requireCountry(ctx, sample.countryCode),
        requireCity(ctx, sample.countryCode, sample.citySlug),
        requireSticker(ctx, sample.stickerCode),
      ]);

      const existingListing = await findExistingSeedListing(
        ctx,
        sellerId,
        sticker._id,
        city._id,
      );
      const updatedAt = now - sample.updatedHoursAgo * 60 * 60 * 1000;

      const listingFields = {
        stickerId: sticker._id,
        sellerId,
        countryId: country._id,
        countryCode: country.code,
        cityId: city._id,
        cityName: city.name,
        priceCents: sample.priceCents,
        currency: country.currency,
        imageUrl: sample.imageUrl,
        quantityAvailable: sample.quantityAvailable,
        quantitySold: sample.quantitySold,
        status: sample.status,
        updatedAt,
      };

      if (existingListing) {
        await ctx.db.patch(existingListing._id, listingFields);
        listingsUpdated += 1;
      } else {
        await ctx.db.insert("listings", listingFields);
        listingsCreated += 1;
      }
    }

    return {
      sellersCreated,
      sellersUpdated,
      listingsCreated,
      listingsUpdated,
      totalSeedListings: sampleListings.length,
    };
  },
});
