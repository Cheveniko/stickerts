<script lang="ts">
  import * as m from "$lib/paraglide/messages";
  import { api } from "$convex/_generated/api";
  import { useQuery } from "convex-svelte";
  import ListingsSkeleton from "$lib/components/skeletons/listings-skeleton.svelte";
  import ListingsGrid from "$lib/components/listings-grid.svelte";

  const listingsQuery = useQuery(
    api.listings.getActiveListingsWithCountryAndSticker,
    () => ({}),
  );
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
  {:else}
    <ListingsGrid listings={listingsQuery.data} />
  {/if}
</main>
