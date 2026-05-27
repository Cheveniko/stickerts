<script lang="ts">
  import type { ListingWithRelations } from "$convex/listings";
  import * as m from "$lib/paraglide/messages";
  import * as Card from "$lib/components/ui/card/index.js";
  import { getLocale, localizeHref } from "$lib/paraglide/runtime";
  import { formatCityName, formatMoney, getInitial } from "$lib/utils";
  import PurchaseModal from "$lib/components/purchase-modal.svelte";

  type Props = {
    listing: ListingWithRelations;
  };

  const { listing }: Props = $props();

  let listingPrice = $derived(
    formatMoney({
      amount: listing.priceCents,
      currency: listing.currency,
      currencySymbol: listing.city.currencySymbol,
      locale: getLocale(),
    }),
  );

  let listingCity = $derived(
    formatCityName(listing.city.name, listing.city.flagEmoji),
  );

  let listingHref = $derived(localizeHref(`/listing/${listing._id}`));

  let listingImageAlt = $derived(
    m.listing_image_alt({ name: listing.sticker.label }),
  );

  let quantityLabel = $derived(
    m.listing_quantity_short({ count: listing.quantityAvailable }),
  );

  let modalOpen = $state(false);
</script>

<Card.Root
  class="cursor-default gap-0 p-0 [transition-property:transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-lg"
>
  <div class="relative aspect-3/4 overflow-hidden rounded-t-4xl">
    <img
      src={listing.imageUrl}
      alt={listingImageAlt}
      class="h-full w-full object-cover ring-1 ring-black/10 dark:ring-white/10"
    />

    {#if listing.sticker.code}
      <span
        class="absolute bottom-2 left-2 rounded-md bg-black/55 px-1.5 py-0.5 font-mono text-[10px] leading-none tracking-widest text-white backdrop-blur-sm"
      >
        {listing.sticker.code}
      </span>
    {/if}

    {#if listing.quantityAvailable > 1}
      <span
        class="absolute top-2 right-2 rounded-md bg-indigo-500/90 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-white backdrop-blur-sm"
      >
        {quantityLabel}
      </span>
    {/if}
  </div>

  <Card.Content class="flex flex-col gap-0.5 px-3 pt-3 pb-0">
    <Card.Title
      class="line-clamp-2 text-sm leading-snug font-semibold [text-wrap:balance]"
    >
      <a
        href={listingHref}
        class="text-inherit no-underline hover:text-foreground"
      >
        {listing.sticker.label}
      </a>
    </Card.Title>
    <Card.Description class="text-xs">
      {listingCity}
    </Card.Description>
  </Card.Content>

  <Card.Footer class="items-end justify-between gap-2 px-3 pt-2.5 pb-3">
    <div
      class="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-1 ring-black/10 dark:ring-white/10"
      title={listing.sellerName}
    >
      {getInitial(listing.sellerName)}
    </div>

    <div class="flex shrink-0 items-center gap-2">
      <span class="text-sm font-bold text-foreground tabular-nums">
        {listingPrice}
      </span>
      <button
        onclick={() => (modalOpen = true)}
        class="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground [transition-property:transform] duration-150 hover:brightness-105 active:scale-[0.96]"
      >
        {m.listing_buy()}
      </button>
    </div>
  </Card.Footer>
</Card.Root>

<PurchaseModal {listing} bind:open={modalOpen} />
