import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { Sticker } from "./stickers";
import type { Country } from "./countries";
import type { Seller } from "./sellers";

export type Listing = Doc<"listings">;

export type ListingWithRelations = Listing & {
  country: Country;
  sticker: Sticker;
  seller: Seller;
};

async function enrichListing(
  ctx: QueryCtx,
  listing: Listing,
): Promise<ListingWithRelations> {
  const [country, sticker, seller] = await Promise.all([
    ctx.db
      .query("countries")
      .withIndex("by_code", (q) => q.eq("code", listing.countryCode))
      .unique(),
    ctx.db.get(listing.stickerId),
    ctx.db.get(listing.sellerId),
  ]);

  if (!country || !sticker || !seller) {
    throw new Error(`Listing ${listing._id} is missing required relations`);
  }

  return {
    ...listing,
    country,
    sticker,
    seller,
  };
}

export const getActiveListingsWithCountryAndSticker = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    return Promise.all(listings.map((listing) => enrichListing(ctx, listing)));
  },
});
