<script lang="ts">
  import { untrack } from "svelte";
  import axios from "axios";
  import { api } from "$convex/_generated/api";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import ImageUploader from "$lib/components/image-uploader.svelte";
  import StickersMultiCombobox from "$lib/components/stickers-multi-combobox.svelte";
  import { getConvexErrorMessage } from "$lib/convex-errors";
  import {
    CITIES_BY_COUNTRY_CODE,
    COUNTRIES,
    CURRENCIES,
  } from "$lib/location-data";
  import {
    createSignedUploadResponseSchema,
    listingIntents,
    type ListingIntent,
  } from "$lib/schemas";
  import type { SellerListingForSettings } from "$convex/listings";
  import type { Sticker } from "$convex/stickers";
  import { page } from "$app/state";
  import { useConvexClient } from "convex-svelte";
  import { cn, getListingImageUrl } from "$lib/utils";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import * as m from "$lib/paraglide/messages";

  type Props = {
    id?: string;
    listing: SellerListingForSettings;
    submitting?: boolean;
    onSuccess?: () => void;
  };

  let {
    id,
    listing,
    submitting = $bindable(false),
    onSuccess,
  }: Props = $props();

  const convex = useConvexClient();
  const stickers = $derived<Sticker[]>(page.data.stickers ?? []);

  // Image state
  let imageFile = $state<File | null>(null);
  let showImageUploader = $state(false);
  const currentImageUrl = $derived(getListingImageUrl(listing.imageKey));

  // Form fields — initialized once from listing (intentional: form is remounted per listing)
  let intent = $state<ListingIntent>(untrack(() => listing.intent));
  let price = $state<number | null | undefined>(
    untrack(() =>
      listing.priceCents !== undefined ? listing.priceCents / 100 : null,
    ),
  );
  let quantity = $state<number | undefined>(
    untrack(() => listing.quantityAvailable),
  );
  let selectedCountryCode = $state(untrack(() => listing.city.countryCode));
  let selectedCitySlug = $state(untrack(() => listing.citySlug));
  let selectedCurrency = $state(
    untrack(() => listing.currency ?? listing.city.currency ?? ""),
  );
  let tradeDescription = $state(untrack(() => listing.tradeDescription ?? ""));
  let wantedStickerIds = $state<Sticker["_id"][]>(
    untrack(() => [...listing.wantedStickerIds]),
  );
  let submitError = $state("");

  const selectedCountry = $derived(
    COUNTRIES.find((c) => c.code === selectedCountryCode),
  );
  const availableCities = $derived(
    CITIES_BY_COUNTRY_CODE[selectedCountryCode] ?? [],
  );
  const selectedCity = $derived(
    availableCities.find((city) => city.slug === selectedCitySlug),
  );
  const selectedCurrencyData = $derived(
    CURRENCIES.find((c) => c.code === selectedCurrency),
  );
  const isForSale = $derived(intent === "sale" || intent === "sale_or_trade");
  const isForTrade = $derived(intent === "trade" || intent === "sale_or_trade");

  function onCountryChange(value: string | undefined) {
    if (!value) return;
    selectedCountryCode = value;
    selectedCitySlug = "";
    const country = COUNTRIES.find((entry) => entry.code === value);
    if (country) selectedCurrency = country.currency;
  }

  function onCityChange(value: string | undefined) {
    if (!value) return;
    selectedCitySlug = value;
    const city = availableCities.find((entry) => entry.slug === value);
    if (city) selectedCurrency = city.currency;
  }

  function onCurrencyChange(value: string | undefined) {
    if (!value) return;
    selectedCurrency = value;
  }

  function switchToUploader() {
    showImageUploader = true;
    imageFile = null;
  }

  function cancelImageChange() {
    showImageUploader = false;
    imageFile = null;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (submitting) return;

    submitError = "";

    if (!selectedCitySlug) {
      submitError = m.listing_form_city_required();
      return;
    }
    if (isForSale && (price === null || price === undefined)) {
      submitError = m.listing_form_price_required();
      return;
    }
    if (isForSale && !selectedCurrency) {
      submitError = m.listing_form_currency_required();
      return;
    }
    if (!quantity || quantity <= 0) {
      submitError = m.listing_form_quantity_required();
      return;
    }

    submitting = true;
    let imageKey = listing.imageKey;

    try {
      if (imageFile !== null) {
        const response = await axios.post("/api/uploads/listings", {
          contentType: imageFile.type,
          size: imageFile.size,
        });

        const parsedUpload = createSignedUploadResponseSchema.safeParse(
          response.data,
        );
        if (!parsedUpload.success) {
          throw new Error(m.listing_form_upload_prepare_error());
        }

        const { signedUrl, imageKey: newKey } = parsedUpload.data;
        await axios.put(signedUrl, imageFile, {
          headers: { "Content-Type": imageFile.type },
        });
        imageKey = newKey;
      }

      const priceCents =
        isForSale && price !== null && price !== undefined
          ? Math.round(price * 100)
          : undefined;

      await convex.mutation(api.listings.updateCurrentSellerListing, {
        listingId: listing._id,
        intent,
        citySlug: selectedCitySlug,
        currency: isForSale ? selectedCurrency || undefined : undefined,
        imageKey,
        priceCents,
        quantityAvailable: quantity,
        tradeDescription:
          isForTrade && tradeDescription ? tradeDescription : undefined,
        wantedStickerIds: isForTrade ? wantedStickerIds : [],
      });

      submitError = "";
      onSuccess?.();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        submitError = m.listing_form_save_error();
      } else if (
        typeof error === "object" &&
        error !== null &&
        "data" in error
      ) {
        submitError = getConvexErrorMessage(error);
      } else {
        submitError = m.listing_form_save_error();
      }
    } finally {
      submitting = false;
    }
  }
</script>

<form {id} onsubmit={handleSubmit} class="flex flex-col gap-5">
  <!-- Sticker (read-only) -->
  <div class="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
    {#if listing.sticker.code}
      <span
        class="font-mono text-xs tracking-wider text-muted-foreground uppercase"
      >
        {listing.sticker.code}
      </span>
    {/if}
    <span class="text-sm font-medium">{listing.sticker.label}</span>
  </div>

  <!-- Intent segmented control -->
  <div class="flex rounded-4xl border border-input bg-muted/50 p-1">
    {#each listingIntents as intentOption (intentOption)}
      <button
        type="button"
        onclick={() => (intent = intentOption)}
        class={cn(
          "flex-1 rounded-3xl px-3 py-1 text-xs font-medium transition-all active:scale-[0.96]",
          intent === intentOption
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {intentOption === "sale"
          ? m.listing_intent_sale()
          : intentOption === "trade"
            ? m.listing_intent_trade()
            : m.listing_intent_both()}
      </button>
    {/each}
  </div>

  <!-- Image -->
  <div class="flex flex-col gap-1.5">
    <Label>{m.listing_label_photo()}</Label>
    {#if showImageUploader}
      <ImageUploader bind:file={imageFile} />
      {#if imageFile === null}
        <button
          type="button"
          onclick={cancelImageChange}
          class="text-left text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {m.listing_current_image()}
        </button>
      {/if}
    {:else}
      <div
        class="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl"
      >
        <img
          src={currentImageUrl}
          alt={listing.sticker.label}
          class="h-full w-full object-cover ring-1 ring-black/10 dark:ring-white/10"
        />
        <div
          class="absolute inset-0 flex items-end justify-center pb-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        >
          <button
            type="button"
            onclick={switchToUploader}
            class="flex items-center gap-1.5 rounded-xl bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors duration-150 hover:bg-black/70 active:scale-[0.96]"
          >
            <RefreshCwIcon class="size-3" />
            {m.listing_change_photo()}
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Price & Quantity -->
  {#if isForSale}
    <div class="grid grid-cols-2 gap-3">
      <div class="flex flex-col gap-1.5">
        <Label for="edit-listing-precio">{m.listing_label_price()}</Label>
        <Input
          id="edit-listing-precio"
          type="number"
          placeholder="0.00"
          bind:value={price}
          min="0.01"
          step="0.01"
          class="border-input bg-card"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="edit-listing-cantidad">{m.listing_label_quantity()}</Label>
        <Input
          id="edit-listing-cantidad"
          type="number"
          placeholder="1"
          bind:value={quantity}
          min="1"
          step="1"
          class="border-input bg-card"
        />
      </div>
    </div>
  {:else}
    <div class="flex flex-col gap-1.5">
      <Label for="edit-listing-cantidad">{m.listing_label_quantity()}</Label>
      <Input
        id="edit-listing-cantidad"
        type="number"
        placeholder="1"
        bind:value={quantity}
        min="1"
        step="1"
        class="border-input bg-card"
      />
    </div>
  {/if}

  <!-- Country & City -->
  <div class="grid grid-cols-2 gap-3">
    <div class="flex flex-col gap-1.5">
      <Label>{m.common_country()}</Label>
      <Select.Root
        type="single"
        value={selectedCountryCode}
        onValueChange={onCountryChange}
      >
        <Select.Trigger class="h-9 w-full border-input bg-card text-sm">
          {#if selectedCountry}
            {selectedCountry.flagEmoji} {selectedCountry.name}
          {:else}
            <span class="text-muted-foreground">{m.common_country()}</span>
          {/if}
        </Select.Trigger>
        <Select.Content class="max-h-60">
          {#each COUNTRIES as country (country.code)}
            <Select.Item
              value={country.code}
              label="{country.flagEmoji} {country.name}"
            />
          {/each}
        </Select.Content>
      </Select.Root>
    </div>

    <div class="flex flex-col gap-1.5">
      <Label>{m.common_city()}</Label>
      <Select.Root
        type="single"
        value={selectedCitySlug}
        onValueChange={onCityChange}
        disabled={!selectedCountryCode}
      >
        <Select.Trigger class="h-9 w-full border-input bg-card text-sm">
          {#if !selectedCountryCode}
            <span class="text-muted-foreground">{m.common_country_first()}</span
            >
          {:else if selectedCity}
            {selectedCity.name}
          {:else}
            <span class="text-muted-foreground">{m.common_city()}</span>
          {/if}
        </Select.Trigger>
        <Select.Content class="max-h-60">
          {#each availableCities as city (city.slug)}
            <Select.Item value={city.slug} label={city.name} />
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  </div>

  <!-- Currency -->
  {#if isForSale}
    <div class="flex flex-col gap-1.5">
      <Label>{m.common_currency()}</Label>
      <Select.Root
        type="single"
        value={selectedCurrency}
        onValueChange={onCurrencyChange}
      >
        <Select.Trigger class="h-9 w-full border-input bg-card text-sm">
          {#if selectedCurrencyData}
            {selectedCurrencyData.symbol}
            {selectedCurrencyData.code} - {selectedCurrencyData.name}
          {:else}
            <span class="text-muted-foreground"
              >{m.common_select_currency()}</span
            >
          {/if}
        </Select.Trigger>
        <Select.Content class="max-h-60">
          {#each CURRENCIES as currency (currency.code)}
            <Select.Item
              value={currency.code}
              label="{currency.symbol} {currency.code} - {currency.name}"
            />
          {/each}
        </Select.Content>
      </Select.Root>
    </div>
  {/if}

  <!-- Trade fields -->
  {#if isForTrade}
    <div class="flex flex-col gap-1.5">
      <Label>{m.listing_label_wanted_stickers()}</Label>
      <StickersMultiCombobox {stickers} bind:value={wantedStickerIds} />
    </div>
    <div class="flex flex-col gap-1.5">
      <Label for="edit-listing-trade-description">
        {m.listing_label_trade_description()}
        <span class="text-xs text-muted-foreground">{m.common_optional()}</span>
      </Label>
      <Textarea
        id="edit-listing-trade-description"
        bind:value={tradeDescription}
        placeholder={m.listing_trade_description_placeholder()}
        class="border-input bg-card"
      />
    </div>
  {/if}

  {#if submitError}
    <p class="text-sm text-destructive">{submitError}</p>
  {/if}
</form>
