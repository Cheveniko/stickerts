<script lang="ts">
  import { useQuery } from "convex-svelte";
  import { api } from "$convex/_generated/api";
  import * as m from "$lib/paraglide/messages";
  import SoldStickerCard from "$lib/components/sold-sticker-card.svelte";
  import SalesSkeleton from "./skeletons/sales-skeleton.svelte";

  const salesQuery = useQuery(api.sales.getRecentPublicSales, () => ({}));
</script>

<section class="space-y-4">
  <h2 class="text-xl font-semibold">{m.recent_sales_heading()}</h2>
  {#if salesQuery.isLoading}
    <SalesSkeleton />
  {:else if salesQuery.data && salesQuery.data.length > 0}
    <div class="grid grid-cols-1 gap-2 md:grid-cols-4">
      {#each salesQuery.data as sale, i (sale._id)}
        <div
          class="animate-in duration-300 fade-in-0 fill-mode-both slide-in-from-bottom-2"
          style="animation-delay: {i * 80}ms"
        >
          <SoldStickerCard {sale} />
        </div>
      {/each}
    </div>
  {/if}
</section>
