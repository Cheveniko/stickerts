<script lang="ts">
  import type { SellerListingForSettings } from "$convex/listings";
  import * as Tooltip from "$lib/components/ui/tooltip/index.js";
  import { formatMoney, getListingImageUrl } from "$lib/utils";
  import { getLocale } from "$lib/paraglide/runtime";
  import EditListingDrawer from "$lib/components/edit-listing-drawer.svelte";
  import DeleteListingDialog from "$lib/components/delete-listing-dialog.svelte";
  import RecordSaleDialog from "$lib/components/record-sale-dialog.svelte";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import Trash2Icon from "@lucide/svelte/icons/trash-2";
  import ArrowLeftRightIcon from "@lucide/svelte/icons/arrow-left-right";
  import ReceiptIcon from "@lucide/svelte/icons/receipt";
  import * as m from "$lib/paraglide/messages";

  type Props = {
    listing: SellerListingForSettings;
  };

  const { listing }: Props = $props();

  let editOpen = $state(false);
  let deleteOpen = $state(false);
  let recordSaleOpen = $state(false);

  const canRecordSale = $derived(
    listing.intent !== "trade" &&
      listing.status !== "removed" &&
      listing.status !== "sold_out",
  );

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
            class="font-mono text-[10px] tracking-wider text-muted-foreground uppercase"
          >
            {listing.sticker.code}
          </span>
        {/if}
      </div>
      <p class="truncate text-sm leading-snug font-medium">
        {listing.sticker.label}
      </p>
    </div>

    <!-- Price / intent -->
    <div
      class="flex shrink-0 items-center justify-end text-xs text-muted-foreground tabular-nums"
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
      {#if canRecordSale}
        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <button
                {...props}
                aria-label={m.record_sale_button_aria()}
                onclick={() => (recordSaleOpen = true)}
                class="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-emerald-500/10 hover:text-emerald-600 active:scale-[0.96]"
              >
                <ReceiptIcon class="size-3.5" />
              </button>
            {/snippet}
          </Tooltip.Trigger>
          <Tooltip.Content sideOffset={6}
            >{m.record_sale_button_aria()}</Tooltip.Content
          >
        </Tooltip.Root>
      {/if}

      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              aria-label={m.seller_listing_edit_aria()}
              onclick={() => (editOpen = true)}
              class="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted hover:text-foreground active:scale-[0.96]"
            >
              <PencilIcon class="size-3.5" />
            </button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content sideOffset={6}
          >{m.seller_listing_edit()}</Tooltip.Content
        >
      </Tooltip.Root>

      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              aria-label={m.seller_listing_delete_aria()}
              onclick={() => (deleteOpen = true)}
              class="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-destructive/10 hover:text-destructive active:scale-[0.96]"
            >
              <Trash2Icon class="size-3.5" />
            </button>
          {/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content sideOffset={6}
          >{m.seller_listing_delete()}</Tooltip.Content
        >
      </Tooltip.Root>
    </div>
  </div>
</Tooltip.Provider>

<EditListingDrawer {listing} bind:open={editOpen} />
<DeleteListingDialog {listing} bind:open={deleteOpen} />
<RecordSaleDialog {listing} bind:open={recordSaleOpen} />
