<script lang="ts">
  import type { ListingWithRelations } from "$convex/listings";
  import * as m from "$lib/paraglide/messages";
  import * as Card from "$lib/components/ui/card/index.js";
  import { getLocale } from "$lib/paraglide/runtime";
  import {
    formatCityName,
    formatMoney,
    getInitial,
    getListingImageUrl,
  } from "$lib/utils";
  import { useCurrentUser } from "$lib/hooks/useCurrentUser.svelte";
  import CollectorPassModal from "$lib/components/collector-pass-modal.svelte";
  import LoginModal from "$lib/components/login-modal.svelte";
  import PurchaseModal from "$lib/components/purchase-modal.svelte";
  import ArrowLeftRightIcon from "@lucide/svelte/icons/arrow-left-right";

  type Props = {
    listing: ListingWithRelations;
  };

  const { listing }: Props = $props();

  let listingPrice = $derived(
    listing.priceCents !== undefined && listing.currency !== undefined
      ? formatMoney({
          amount: listing.priceCents,
          currency: listing.currency,
          currencySymbol: listing.city.currencySymbol,
          locale: getLocale(),
        })
      : null,
  );

  const ctaLabel = $derived(
    listing.intent === "sale"
      ? m.listing_buy()
      : listing.intent === "trade"
        ? "Intercambiar"
        : "Contactar",
  );

  let listingCity = $derived(
    formatCityName(listing.city.name, listing.city.flagEmoji),
  );

  let listingImageUrl = $derived(getListingImageUrl(listing.imageKey));

  let listingImageAlt = $derived(
    m.listing_image_alt({ name: listing.sticker.label }),
  );

  let quantityLabel = $derived(
    m.listing_quantity_short({ count: listing.quantityAvailable }),
  );

  const currentUser = $derived.by(useCurrentUser());

  let purchaseOpen = $state(false);
  let loginOpen = $state(false);
  let collectorPassOpen = $state(false);

  function handleCtaClick() {
    if (currentUser.status === "authenticated") {
      if (
        currentUser.seller !== null ||
        currentUser.user.freeSellerContactsRemaining > 0
      ) {
        purchaseOpen = true;
        return;
      }

      collectorPassOpen = true;
      return;
    }

    if (currentUser.status === "anonymous") {
      loginOpen = true;
    }
  }

  function handleCollectorPassSuccess() {
    collectorPassOpen = false;

    setTimeout(() => {
      purchaseOpen = true;
    }, 300);
  }
</script>

<Card.Root
  class="cursor-default gap-0 p-0 [transition-property:transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-lg"
>
  <div class="relative aspect-3/4 overflow-hidden rounded-t-4xl">
    <img
      src={listingImageUrl}
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
      <p class="text-inherit no-underline hover:text-foreground">
        {listing.sticker.label}
      </p>
    </Card.Title>
    <Card.Description class="text-xs">
      {listingCity}
    </Card.Description>
  </Card.Content>

  <Card.Footer class="flex flex-col items-stretch gap-2.5 px-3 pt-2 pb-3">
    <!-- Info row: avatar (left) + price / intent indicator (right) -->
    <div class="flex items-center justify-between">
      <div
        class="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground ring-1 ring-black/10 dark:ring-white/10"
        title={listing.sellerName}
      >
        {getInitial(listing.sellerName)}
      </div>

      {#if listing.intent === "sale"}
        <span class="text-sm font-bold text-foreground tabular-nums">
          {listingPrice}
        </span>
      {:else if listing.intent === "trade"}
        <span class="flex items-center gap-1 text-sm font-medium">
          <ArrowLeftRightIcon class="size-3.5" />
          Intercambio
        </span>
      {:else}
        <span
          class="flex items-center gap-1.5 text-sm font-bold text-foreground tabular-nums"
        >
          {listingPrice}
          <ArrowLeftRightIcon class="size-3" />
        </span>
      {/if}
    </div>

    <!-- CTA button: full width -->
    <button
      onclick={handleCtaClick}
      class="w-full rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground [transition-property:transform] duration-150 hover:brightness-105 active:scale-[0.96]"
    >
      {ctaLabel}
    </button>
  </Card.Footer>
</Card.Root>

<PurchaseModal {listing} bind:open={purchaseOpen} />
<CollectorPassModal
  bind:open={collectorPassOpen}
  onsuccess={handleCollectorPassSuccess}
/>
<LoginModal bind:open={loginOpen} />
