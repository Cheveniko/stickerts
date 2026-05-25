<script lang="ts">
  import type { ListingWithRelations } from "$convex/listings";
  import ListingCard from "$lib/components/listing-card.svelte";

  type Props = { listings: ListingWithRelations[] };

  const { listings }: Props = $props();
</script>

<div
  class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5"
>
  {#each listings as listing (listing._id)}
    <ListingCard {listing} />
  {/each}
</div>
