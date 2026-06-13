<script lang="ts">
  import * as m from "$lib/paraglide/messages";
  import ListingCard from "$lib/components/listing-card.svelte";
  import { api } from "$convex/_generated/api";
  import { useQuery } from "convex-svelte";
  import { useSearchParams } from "runed/kit";
  import { listingSearchParamsSchema } from "$lib/schemas";
  import ListingsSkeleton from "./skeletons/listings-skeleton.svelte";

  const listingsQuery = useQuery(
    api.listings.getActiveListingsWithDetails,
    () => ({}),
  );

  const params = useSearchParams(listingSearchParamsSchema);

  function normalizeSearchValue(value: string) {
    return value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  }

  const normalizedSearch = $derived(normalizeSearchValue(params.q));
  const filteredListings = $derived.by(() => {
    const listings = listingsQuery.data ?? [];

    if (normalizedSearch === "") {
      return listings;
    }

    return listings.filter((listing) => {
      const normalizedCode = normalizeSearchValue(listing.sticker.code);
      const normalizedLabel = normalizeSearchValue(listing.sticker.label);

      return (
        normalizedCode.includes(normalizedSearch) ||
        normalizedLabel.includes(normalizedSearch)
      );
    });
  });
</script>

<section class="space-y-4">
  <h2 class="text-xl font-semibold">{m.home_heading()}</h2>
  {#if listingsQuery.isLoading}
    <ListingsSkeleton />
  {:else if listingsQuery.error}
    <p>{m.home_error_generic()}</p>
  {:else if listingsQuery.data?.length === 0}
    {@render emptyState("listing")}
  {:else if filteredListings.length === 0}
    {@render emptyState("search")}
  {:else}
    <div
      class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5"
    >
      {#each filteredListings as listing (listing._id)}
        <ListingCard {listing} />
      {/each}
    </div>
  {/if}
</section>

{#snippet emptyState(type: "listing" | "search")}
  <div class="flex flex-col items-center justify-center py-24">
    <span class="text-4xl">🔍</span>
    <p class="mt-3 text-sm text-muted-foreground">
      {#if type === "listing"}
        {m.home_empty_listings()}
      {:else}
        {m.home_no_search_results()}
      {/if}
    </p>
  </div>
{/snippet}
