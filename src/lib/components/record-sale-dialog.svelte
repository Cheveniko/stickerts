<script lang="ts">
  import { untrack } from "svelte";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { api } from "$convex/_generated/api";
  import { useConvexClient } from "convex-svelte";
  import type { SellerListingForSettings } from "$convex/listings";
  import { getConvexErrorMessage } from "$lib/convex-errors";
  import * as m from "$lib/paraglide/messages";
  import { createRecordSaleFormSchema } from "$lib/schemas";
  import { formatMoney, getListingImageUrl } from "$lib/utils";
  import { getLocale } from "$lib/paraglide/runtime";
  import { toast } from "svelte-sonner";

  type Props = {
    listing: SellerListingForSettings;
    open?: boolean;
  };

  let { listing, open = $bindable(false) }: Props = $props();

  const convex = useConvexClient();

  let isRecording = $state(false);
  let recordError = $state("");
  let quantity = $state<number | undefined>(1);
  let unitPrice = $state<number | null | undefined>(
    untrack(() =>
      listing.priceCents !== undefined ? listing.priceCents / 100 : null,
    ),
  );

  const hasUnitPrice = $derived(
    listing.priceCents !== undefined && listing.currency !== undefined,
  );
  let quantityBlurred = $state(false);
  let unitPriceBlurred = $state(false);
  const imageUrl = $derived(getListingImageUrl(listing.imageKey));
  const formValidation = $derived(
    createRecordSaleFormSchema(
      listing.quantityAvailable,
      hasUnitPrice,
    ).safeParse({ quantity, unitPrice }),
  );
  const quantityError = $derived.by(() => {
    if (formValidation.success) {
      return "";
    }

    return (
      formValidation.error.issues.find((issue) => issue.path[0] === "quantity")
        ?.message ?? ""
    );
  });
  const unitPriceError = $derived.by(() => {
    if (formValidation.success) {
      return "";
    }

    return (
      formValidation.error.issues.find((issue) => issue.path[0] === "unitPrice")
        ?.message ?? ""
    );
  });
  const formattedDefaultPrice = $derived(
    hasUnitPrice
      ? formatMoney({
          amount: listing.priceCents!,
          currency: listing.currency!,
          currencySymbol: listing.city.currencySymbol,
          locale: getLocale(),
        })
      : undefined,
  );

  function handleQuantityInput(event: Event) {
    recordError = "";

    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const numericValue = target.value.replace(/\D/g, "");
    if (numericValue.length === 0) {
      quantity = undefined;
      return;
    }

    quantity = Number.parseInt(numericValue, 10);
  }

  function handleUnitPriceInput() {
    recordError = "";
  }

  function handleQuantityBlur() {
    quantityBlurred = true;
  }

  function handleUnitPriceBlur() {
    unitPriceBlurred = true;
  }

  function resetForm() {
    recordError = "";
    quantity = 1;
    unitPrice =
      listing.priceCents !== undefined ? listing.priceCents / 100 : null;
    quantityBlurred = false;
    unitPriceBlurred = false;
  }

  async function handleRecordSale() {
    if (isRecording) {
      return;
    }

    recordError = "";

    quantityBlurred = true;
    unitPriceBlurred = true;

    if (!formValidation.success) {
      return;
    }

    isRecording = true;

    try {
      await convex.mutation(api.sales.recordCurrentSellerSale, {
        listingId: listing._id,
        quantity: formValidation.data.quantity,
        unitPriceCents: formValidation.data.unitPriceCents,
      });

      toast.success(m.record_sale_success());
      resetForm();
      open = false;
    } catch (error) {
      recordError = getConvexErrorMessage(error);
    } finally {
      isRecording = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content showCloseButton={false} class="gap-4">
    <Dialog.Header>
      <Dialog.Title>{m.record_sale_title()}</Dialog.Title>
      <Dialog.Description>
        <img
          src={imageUrl}
          alt={listing.sticker.label}
          class="mr-1 inline-block size-5 rounded object-cover align-middle ring-1 ring-black/10 dark:ring-white/10"
        />
        {m.record_sale_description_prefix()}
        {listing.sticker.label}.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-4">
      <div
        class="flex flex-col gap-1.5"
        style="animation: fadeSlideIn 0.2s ease both; animation-delay: 0ms"
      >
        <Label for="record-sale-quantity"
          >{m.record_sale_quantity_label()}</Label
        >
        <Input
          id="record-sale-quantity"
          type="number"
          min={1}
          max={listing.quantityAvailable}
          step={1}
          inputmode="numeric"
          bind:value={quantity}
          oninput={handleQuantityInput}
          onblur={handleQuantityBlur}
          disabled={isRecording}
          class="tabular-nums"
        />
        {#if quantityBlurred && quantityError}
          <p class="text-xs text-destructive">{quantityError}</p>
        {:else}
          <p class="text-xs text-muted-foreground tabular-nums">
            {m.record_sale_quantity_hint({ max: listing.quantityAvailable })}
          </p>
        {/if}
      </div>

      {#if hasUnitPrice}
        <div
          class="flex flex-col gap-1.5"
          style="animation: fadeSlideIn 0.2s ease both; animation-delay: 80ms"
        >
          <Label for="record-sale-price">{m.record_sale_price_label()}</Label>
          <div class="relative">
            <Input
              id="record-sale-price"
              type="number"
              min={0.01}
              step={0.01}
              bind:value={unitPrice}
              oninput={handleUnitPriceInput}
              onblur={handleUnitPriceBlur}
              disabled={isRecording}
              class="tabular-nums"
            />
          </div>
          {#if unitPriceBlurred && unitPriceError}
            <p class="text-xs text-destructive">{unitPriceError}</p>
          {:else}
            <p class="text-xs text-muted-foreground">
              {m.record_sale_price_published({
                price: formattedDefaultPrice ?? "",
              })}
            </p>
          {/if}
        </div>
      {/if}
    </div>

    {#if recordError}
      <p role="alert" class="text-xs text-destructive">{recordError}</p>
    {/if}

    <Dialog.Footer class="gap-2">
      <Button
        variant="ghost"
        disabled={isRecording}
        class="border border-border transition-[background-color,transform] duration-150 active:scale-[0.96]"
        onclick={() => {
          resetForm();
          open = false;
        }}
      >
        {m.common_cancel()}
      </Button>
      <Button
        disabled={isRecording}
        class="transition-[background-color,transform] duration-150 active:scale-[0.96]"
        onclick={handleRecordSale}
      >
        {isRecording ? m.record_sale_recording() : m.record_sale_confirm()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<style>
  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
