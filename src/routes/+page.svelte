<script lang="ts">
  import * as m from "$lib/paraglide/messages";
  import { api } from "$convex/_generated/api";
  import { useQuery } from "convex-svelte";

  const listingsQuery = useQuery(
    api.listings.getActiveListingsWithCountryAndSticker,
    () => ({}),
  );

  $inspect(listingsQuery.data);
</script>

<main class="container space-y-6 pt-34">
  <h2 class="text-xl font-semibold">{m.home_heading()}</h2>

  {#if listingsQuery.isLoading}
    <p>Cargando listings activos...</p>
  {:else if listingsQuery.error}
    <p>Error cargando listings activos: {listingsQuery.error.toString()}</p>
  {:else}
    <ul>
      {#each listingsQuery.data as listing (listing._id)}
        <li>
          {listing.sticker?.code ?? "Cromo desconocido"} · {listing.cityName} · {listing
            .country?.flagEmoji ?? "sin bandera"} · {listing.priceCents}
        </li>
      {/each}
    </ul>
  {/if}
</main>
