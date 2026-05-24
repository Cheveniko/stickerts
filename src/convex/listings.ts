import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

type Listing = Doc<"listings">;

async function enrichListing(ctx: QueryCtx, listing: Listing) {
  const [country, sticker] = await Promise.all([
    ctx.db
      .query("countries")
      .withIndex("by_code", (q) => q.eq("code", listing.countryCode))
      .unique(),
    ctx.db.get(listing.stickerId),
  ]);

  return {
    ...listing,
    country,
    sticker,
  };
}

export const getActiveListingsWithCountryAndSticker = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(50);

    return await Promise.all(listings.map((l) => enrichListing(ctx, l)));
  },
});
