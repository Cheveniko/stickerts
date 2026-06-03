<script lang="ts">
  import type { SellerListingForSettings } from "$convex/listings";
  import SellerStickerCard from "$lib/components/seller-sticker-card.svelte";
  import * as m from "$lib/paraglide/messages";

  type Props = {
    listings: SellerListingForSettings[];
  };

  const { listings }: Props = $props();

  const sorted = $derived(
    [...listings].sort((a, b) => b._creationTime - a._creationTime),
  );

  const activeListings = $derived(
    sorted.filter((l) => l.status === "active" || l.status === "paused"),
  );

  const soldOutListings = $derived(
    sorted.filter((l) => l.status === "sold_out"),
  );
</script>

<div class="flex flex-col gap-4">
  {#if activeListings.length > 0}
    <div class="flex flex-col gap-1.5">
      <p class="px-0.5 text-xs font-medium text-muted-foreground">
        {m.seller_listings_active()} · {activeListings.length}
      </p>
      <div
        class="divide-y divide-border overflow-hidden rounded-2xl border border-border"
      >
        {#each activeListings as listing (listing._id)}
          <SellerStickerCard {listing} />
        {/each}
      </div>
    </div>
  {/if}

  {#if soldOutListings.length > 0}
    <div class="flex flex-col gap-1.5">
      <p class="px-0.5 text-xs font-medium text-muted-foreground">
        {m.seller_listings_sold_out()} · {soldOutListings.length}
      </p>
      <div
        class="divide-y divide-border overflow-hidden rounded-2xl border border-border"
      >
        {#each soldOutListings as listing (listing._id)}
          <SellerStickerCard {listing} />
        {/each}
      </div>
    </div>
  {/if}
</div>
