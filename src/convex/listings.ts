import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

type Listing = Doc<"listings">;
type Country = Doc<"countries">;
type Sticker = Doc<"stickers">;
type User = Doc<"users">;

type ListingWithRelations = Listing & {
  country: Country;
  sticker: Sticker;
  seller: User;
};

async function enrichListing(ctx: QueryCtx, listing: Listing) {
  const [country, sticker, seller] = await Promise.all([
    ctx.db.get(listing.countryId),
    ctx.db.get(listing.stickerId),
    ctx.db.get(listing.sellerId),
  ]);

  return {
    ...listing,
    country,
    sticker,
    seller,
  };
}

export const getActiveListingsWithCountryAndSticker = query({
  args: {},
  handler: async (ctx): Promise<ListingWithRelations[]> => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .take(50);

    return await Promise.all(listings.map((l) => enrichListing(ctx, l)));
  },
});
