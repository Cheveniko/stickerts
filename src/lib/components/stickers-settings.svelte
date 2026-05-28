<script lang="ts">
  import { api } from "$convex/_generated/api";
  import { useQuery } from "convex-svelte";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import SellerStickersList from "$lib/components/seller-stickers-list.svelte";

  const listingsQuery = useQuery(
    api.listings.getCurrentSellerListingsForSettings,
    () => ({}),
  );
</script>

{#if listingsQuery.isLoading}
  <div
    class="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center"
  >
    <div class="flex size-16 items-center justify-center rounded-full bg-muted">
      <LayoutGridIcon class="size-8 text-muted-foreground" />
    </div>
    <div class="flex flex-col gap-1.5">
      <p class="font-semibold">Tus stickers</p>
      <p class="max-w-[240px] text-sm text-pretty text-muted-foreground">
        Cargando tus stickers...
      </p>
    </div>
  </div>
{:else if listingsQuery.error}
  <div
    class="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center"
  >
    <div class="flex size-16 items-center justify-center rounded-full bg-muted">
      <LayoutGridIcon class="size-8 text-muted-foreground" />
    </div>
    <div class="flex flex-col gap-1.5">
      <p class="font-semibold">Tus stickers</p>
      <p
        role="alert"
        class="max-w-[240px] text-sm text-pretty text-destructive"
      >
        No pudimos cargar tus stickers.
      </p>
    </div>
  </div>
{:else if listingsQuery.data?.length === 0}
  <div
    class="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center"
  >
    <div class="flex size-16 items-center justify-center rounded-full bg-muted">
      <LayoutGridIcon class="size-8 text-muted-foreground" />
    </div>
    <div class="flex flex-col gap-1.5">
      <p class="font-semibold">Tus stickers</p>
      <p class="max-w-[240px] text-sm text-pretty text-muted-foreground">
        Aquí verás los stickers que ofreces cuando actives tu cuenta de
        vendedor.
      </p>
    </div>
  </div>
{:else}
  <div class="flex flex-col gap-3 py-2">
    <div class="flex flex-col gap-1">
      <p class="font-semibold">Tus stickers</p>
      <p class="text-sm text-muted-foreground">
        Vista preliminar de tus publicaciones.
      </p>
    </div>

    <SellerStickersList listings={listingsQuery.data} />
  </div>
{/if}
