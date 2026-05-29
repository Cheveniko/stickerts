<script lang="ts">
  import * as m from "$lib/paraglide/messages";
  import { api } from "$convex/_generated/api";
  import { useQuery } from "convex-svelte";
  import { useSearchParams } from "runed/kit";
  import Faq from "$lib/components/faq.svelte";
  import ListingsSkeleton from "$lib/components/skeletons/listings-skeleton.svelte";
  import ListingsGrid from "$lib/components/listings-grid.svelte";
  import { listingSearchParamsSchema } from "$lib/schemas";

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

<main class="container space-y-6 pt-28 pb-16 md:pt-36">
  <h2 class="text-xl font-semibold">{m.home_heading()}</h2>

  {#if listingsQuery.isLoading}
    <ListingsSkeleton />
  {:else if listingsQuery.error}
    <p>Error</p>
  {:else if listingsQuery.data?.length === 0}
    <div class="flex flex-col items-center justify-center py-24">
      <span class="text-4xl">🔍</span>
      <p class="mt-3 text-sm text-muted-foreground">
        No hay cromos disponibles.
      </p>
    </div>
  {:else if filteredListings.length === 0}
    <div class="flex flex-col items-center justify-center py-24">
      <span class="text-4xl">🔍</span>
      <p class="mt-3 text-sm text-muted-foreground">
        No se encontraron cromos para esa busqueda.
      </p>
    </div>
  {:else}
    <ListingsGrid listings={filteredListings} />
  {/if}
  <Faq />
</main>
