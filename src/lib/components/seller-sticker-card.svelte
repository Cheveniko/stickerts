<script lang="ts">
  import type { SellerListingForSettings } from "$convex/listings";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { formatMoney, getListingImageUrl } from "$lib/utils";
  import { getLocale } from "$lib/paraglide/runtime";
  import EditListingDrawer from "$lib/components/edit-listing-drawer.svelte";
  import DeleteListingDialog from "$lib/components/delete-listing-dialog.svelte";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import ArrowLeftRightIcon from "@lucide/svelte/icons/arrow-left-right";

  type Props = {
    listing: SellerListingForSettings;
  };

  const { listing }: Props = $props();

  let editOpen = $state(false);
  let deleteOpen = $state(false);

  const imageUrl = $derived(getListingImageUrl(listing.imageKey));

  const price = $derived(
    listing.priceCents !== undefined && listing.currency !== undefined
      ? formatMoney({
          amount: listing.priceCents,
          currency: listing.currency,
          currencySymbol: listing.city.currencySymbol,
          locale: getLocale(),
        })
      : null,
  );

  const statusDotClass = $derived(
    (
      {
        active: "bg-emerald-500",
        paused: "bg-amber-400",
        sold_out: "bg-muted-foreground/50",
        removed: "bg-destructive",
      } as Record<string, string>
    )[listing.status] ?? "bg-muted-foreground/50",
  );
</script>

<Tooltip.Provider>
  <div
    class="group flex items-center gap-2.5 px-3 py-2.5 transition-colors duration-150 hover:bg-muted/50"
  >
    <!-- Thumbnail -->
    <img
      src={imageUrl}
      alt={listing.sticker.label}
      class="size-9 shrink-0 rounded-lg object-cover ring-1 ring-black/10 dark:ring-white/10"
    />

    <!-- Info -->
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <div class="flex items-center gap-1.5">
        <span class="size-1.5 shrink-0 rounded-full {statusDotClass}"></span>
        {#if listing.sticker.code}
          <span
            class="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {listing.sticker.code}
          </span>
        {/if}
      </div>
      <p class="truncate text-sm font-medium leading-snug">
        {listing.sticker.label}
      </p>
    </div>

    <!-- Price / intent -->
    <div
      class="flex shrink-0 items-center justify-end text-xs tabular-nums text-muted-foreground"
    >
      {#if listing.intent === "trade"}
        <ArrowLeftRightIcon class="size-3.5" />
      {:else if listing.intent === "sale"}
        <span class="font-semibold text-foreground">{price}</span>
      {:else}
        <span class="flex items-center gap-1 font-semibold text-foreground">
          {price}
          <ArrowLeftRightIcon class="size-3" />
        </span>
      {/if}
    </div>

    <!-- Action buttons -->
    <div class="flex shrink-0 items-center gap-0.5">
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              aria-label="Editar publicación"
              onclick={() => (editOpen = true)}
              class="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.96]"
            >
              <PencilIcon class="size-3.5" />
            </button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content sideOffset={6}>Editar</Tooltip.Content>
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              aria-label="Eliminar publicación"
              onclick={() => (deleteOpen = true)}
              class="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-destructive/10 hover:text-destructive active:scale-[0.96]"
            >
              <Trash2Icon class="size-3.5" />
            </button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content sideOffset={6}>Eliminar</Tooltip.Content>
      </Tooltip.Root>
    </div>
  </div>
</Tooltip.Provider>

<EditListingDrawer {listing} bind:open={editOpen} />
<DeleteListingDialog {listing} bind:open={deleteOpen} />
