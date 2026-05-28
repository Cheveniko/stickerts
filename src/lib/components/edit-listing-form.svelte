<script lang="ts">
  import { untrack } from "svelte";
  import axios from "axios";
  import { api } from "$convex/_generated/api";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
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
  let isSoldOut = $state(untrack(() => listing.status === "sold_out"));
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
      submitError = "Selecciona una ciudad.";
      return;
    }
    if (isForSale && (price === null || price === undefined)) {
      submitError = "Ingresa un precio mayor a 0.";
      return;
    }
    if (isForSale && !selectedCurrency) {
      submitError = "Selecciona una moneda.";
      return;
    }
    if (!quantity || quantity <= 0) {
      submitError = "Ingresa una cantidad mayor a 0.";
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
          throw new Error("No pudimos preparar la subida de la imagen.");
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
        isSoldOut,
        tradeDescription:
          isForTrade && tradeDescription ? tradeDescription : undefined,
        wantedStickerIds: isForTrade ? wantedStickerIds : [],
      });

      submitError = "";
      onSuccess?.();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        submitError = "No pudimos guardar los cambios. Inténtalo de nuevo.";
      } else if (
        typeof error === "object" &&
        error !== null &&
        "data" in error
      ) {
        submitError = getConvexErrorMessage(error);
      } else {
        submitError = "No pudimos guardar los cambios. Inténtalo de nuevo.";
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
          ? "Venta"
          : intentOption === "trade"
            ? "Intercambio"
            : "Ambos"}
      </button>
    {/each}
  </div>

  <!-- Image -->
  <div class="flex flex-col gap-1.5">
    <Label>Foto del cromo</Label>
    {#if showImageUploader}
      <ImageUploader bind:file={imageFile} />
      {#if imageFile === null}
        <button
          type="button"
          onclick={cancelImageChange}
          class="text-left text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Usar imagen actual
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
            Cambiar foto
          </button>
        </div>
      </div>
    {/if}
  </div>

  <!-- Price & Quantity -->
  {#if isForSale}
    <div class="grid grid-cols-2 gap-3">
      <div class="flex flex-col gap-1.5">
        <Label for="edit-listing-precio">Precio</Label>
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
        <Label for="edit-listing-cantidad">Cantidad</Label>
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
      <Label for="edit-listing-cantidad">Cantidad</Label>
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
      <Label>País</Label>
      <Select.Root
        type="single"
        value={selectedCountryCode}
        onValueChange={onCountryChange}
      >
        <Select.Trigger class="h-9 w-full border-input bg-card text-sm">
          {#if selectedCountry}
            {selectedCountry.flagEmoji} {selectedCountry.name}
          {:else}
            <span class="text-muted-foreground">País</span>
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
      <Label>Ciudad</Label>
      <Select.Root
        type="single"
        value={selectedCitySlug}
        onValueChange={onCityChange}
        disabled={!selectedCountryCode}
      >
        <Select.Trigger class="h-9 w-full border-input bg-card text-sm">
          {#if !selectedCountryCode}
            <span class="text-muted-foreground">País primero</span>
          {:else if selectedCity}
            {selectedCity.name}
          {:else}
            <span class="text-muted-foreground">Ciudad</span>
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
      <Label>Moneda</Label>
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
            <span class="text-muted-foreground">Selecciona una moneda</span>
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
      <Label>Cromos que te interesan</Label>
      <StickersMultiCombobox {stickers} bind:value={wantedStickerIds} />
    </div>
    <div class="flex flex-col gap-1.5">
      <Label for="edit-listing-trade-description">
        Descripción del intercambio
        <span class="text-xs text-muted-foreground">(Opcional)</span>
      </Label>
      <Textarea
        id="edit-listing-trade-description"
        bind:value={tradeDescription}
        placeholder="(Busco cromos especiales) (Cambio por 3 cromos) etc"
        class="border-input bg-card"
      />
    </div>
  {/if}

  <!-- Sold out toggle -->
  <label
    class="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-muted/50 px-3 py-2.5 select-none"
  >
    <div class="flex flex-col gap-0.5">
      <span class="text-sm font-medium">Marcar como agotado</span>
      <span class="text-xs text-muted-foreground">Oculta la publicación</span>
    </div>
    <Switch size="sm" bind:checked={isSoldOut} disabled={submitting} />
  </label>

  {#if submitError}
    <p class="text-sm text-destructive">{submitError}</p>
  {/if}
</form>
