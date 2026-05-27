import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { City } from "./cities";
import type { Sticker } from "./stickers";
import type { Seller } from "./sellers";

export type Listing = Doc<"listings">;

export type ListingWithRelations = Listing & {
  city: City;
  sticker: Sticker;
  seller: Seller;
  sellerName: string;
};

async function enrichListing(
  ctx: QueryCtx,
  listing: Listing,
): Promise<ListingWithRelations> {
  const [city, sticker, seller] = await Promise.all([
    ctx.db.get(listing.cityId),
    ctx.db.get(listing.stickerId),
    ctx.db.get(listing.sellerId),
  ]);

  if (!city || !sticker || !seller) {
    throw new Error(`Listing ${listing._id} is missing required relations`);
  }

  const sellerUser = await ctx.db.get(seller.userId);

  if (!sellerUser) {
    throw new Error(`Listing ${listing._id} is missing seller user`);
  }

  return {
    ...listing,
    city,
    sticker,
    seller,
    sellerName: sellerUser.name,
  };
}

export const getActiveListingsWithDetails = query({
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
