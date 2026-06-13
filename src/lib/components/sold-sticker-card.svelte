<script lang="ts">
  import type { RecentPublicSale } from "$convex/sales";
  import * as m from "$lib/paraglide/messages";
  import { getLocale } from "$lib/paraglide/runtime";
  import {
    formatCityName,
    formatMoney,
    getListingImageUrl,
    formatRelativeTime,
  } from "$lib/utils";

  type Props = {
    sale: RecentPublicSale;
  };

  const { sale }: Props = $props();

  const imageUrl = $derived(getListingImageUrl(sale.listing.imageKey));
  const imageAlt = $derived(m.recent_sales_image_alt({ name: sale.sticker.label }));
  const cityName = $derived(formatCityName(sale.city.name, sale.city.flagEmoji));
  const unitPrice = $derived(
    formatMoney({
      amount: sale.unitPriceCents,
      currency: sale.currency,
      currencySymbol: sale.city.currencySymbol,
      locale: getLocale(),
    }),
  );
  const relativeTime = $derived(formatRelativeTime(sale.soldAt, getLocale()));
</script>

<div class="flex items-stretch overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5">
  <!-- Left: image fills full card height -->
  <img
    src={imageUrl}
    alt={imageAlt}
    class="w-16 flex-shrink-0 object-cover ring-1 ring-black/10 dark:ring-white/10"
  />

  <!-- Right: all info -->
  <div class="flex min-w-0 flex-1 flex-col justify-between py-3 pr-3 pl-3">
    <p class="line-clamp-2 text-sm leading-tight font-semibold">{sale.sticker.label}</p>

    <div class="mt-2 flex flex-col gap-0.5">
      <p class="truncate text-xs text-muted-foreground">{cityName}</p>
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm font-bold tabular-nums">{unitPrice}</span>
        <span class="flex-shrink-0 text-xs text-muted-foreground">{relativeTime}</span>
      </div>
    </div>
  </div>
</div>
