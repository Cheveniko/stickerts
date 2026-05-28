<script lang="ts">
  import axios from "axios";
  import { api } from "$convex/_generated/api";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import ImageUploader from "$lib/components/image-uploader.svelte";
  import StickersCombobox from "$lib/components/stickers-combobox.svelte";
  import StickersMultiCombobox from "$lib/components/stickers-multi-combobox.svelte";
  import { getConvexErrorMessage } from "$lib/convex-errors";
  import {
    CITIES_BY_COUNTRY_CODE,
    COUNTRIES,
    CURRENCIES,
  } from "$lib/location-data";
  import {
    createSignedUploadResponseSchema,
    newListingFormSchema,
    listingIntents,
    type ListingIntent,
  } from "$lib/schemas";
  import type { Sticker } from "$convex/stickers";
  import type { CurrentSeller } from "$convex/sellers";
  import { page } from "$app/state";
  import { useConvexClient } from "convex-svelte";
  import { cn } from "$lib/utils";

  type Props = {
    id?: string;
    seller: CurrentSeller;
    submitting?: boolean;
    onSuccess?: () => void;
  };

  let {
    id,
    seller,
    submitting = $bindable(false),
    onSuccess,
  }: Props = $props();
  const convex = useConvexClient();

  const stickers = $derived<Sticker[]>(page.data.stickers ?? []);
  let imageFile = $state<File | null>(null);
  let selectedStickerId = $state<Sticker["_id"] | null>(null);
  let price = $state<number | null | undefined>(null);
  let quantity = $state<number | undefined>(1);
  let selectedCountryCode = $derived(seller.city?.countryCode ?? "");
  let selectedCitySlug = $derived(seller.city?.slug ?? "");
  let selectedCurrency = $derived(
    seller.defaultCurrency ?? seller.city?.currency ?? "",
  );
  let submitError = $state("");
  let intent = $state<ListingIntent>("sale");
  let tradeDescription = $state("");
  let wantedStickerIds = $state<Sticker["_id"][]>([]);

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

  function resetForm() {
    imageFile = null;
    selectedStickerId = null;
    price = null;
    quantity = 1;
    selectedCountryCode = seller.city?.countryCode ?? "";
    selectedCitySlug = seller.city?.slug ?? "";
    selectedCurrency = seller.defaultCurrency ?? seller.city?.currency ?? "";
    intent = "trade";
    tradeDescription = "";
    wantedStickerIds = [];
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    if (submitting) return;

    submitError = "";

    const parsedForm = newListingFormSchema.safeParse({
      imageFile,
      intent,
      selectedStickerId,
      selectedCitySlug,
      selectedCurrency,
      price,
      quantity,
      tradeDescription,
      wantedStickerIds,
    });

    if (!parsedForm.success) {
      submitError =
        parsedForm.error.issues[0]?.message ??
        "Revisa los datos antes de publicar.";
      return;
    }

    const {
      imageFile: listingImageFile,
      intent: parsedIntent,
      stickerId,
      citySlug,
      currency,
      priceCents,
      quantityAvailable,
      tradeDescription: parsedTradeDescription,
      wantedStickerIds: parsedWantedStickerIds,
    } = parsedForm.data;

    let didSucceed = false;
    submitting = true;

    try {
      const response = await axios.post("/api/uploads/listings", {
        contentType: listingImageFile.type,
        size: listingImageFile.size,
      });

      const parsedUploadResponse = createSignedUploadResponseSchema.safeParse(
        response.data,
      );

      if (!parsedUploadResponse.success) {
        throw new Error("No pudimos preparar la subida de la imagen.");
      }

      const { signedUrl, imageKey } = parsedUploadResponse.data;

      await axios.put(signedUrl, listingImageFile, {
        headers: {
          "Content-Type": listingImageFile.type,
        },
      });

      await convex.mutation(api.listings.createListing, {
        intent: parsedIntent,
        stickerId,
        citySlug,
        currency,
        imageKey,
        priceCents,
        quantityAvailable,
        tradeDescription: parsedTradeDescription,
        wantedStickerIds: parsedWantedStickerIds,
      });

      resetForm();
      submitError = "";
      didSucceed = true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        submitError =
          "No pudimos subir la imagen o publicar el cromo. Inténtalo de nuevo.";
      } else if (
        typeof error === "object" &&
        error !== null &&
        "data" in error
      ) {
        submitError = getConvexErrorMessage(error);
      } else {
        submitError =
          "No pudimos subir la imagen o publicar el cromo. Inténtalo de nuevo.";
      }
    } finally {
      submitting = false;
    }

    if (didSucceed) {
      onSuccess?.();
    }
  }
</script>

<form {id} onsubmit={handleSubmit} class="flex flex-col gap-5">
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

  <!-- Image uploader -->
  <div class="flex flex-col gap-1.5">
    <Label>Foto del cromo</Label>
    <ImageUploader bind:file={imageFile} />
  </div>

  <!-- Sticker field -->
  <div class="flex flex-col gap-1.5">
    <Label>Cromo</Label>
    <StickersCombobox
      {stickers}
      placeholder="Buscar cromos"
      emptyMessage="No se encontraron stickers."
      bind:value={selectedStickerId}
    />
  </div>

  <!-- Price & Quantity -->
  {#if isForSale}
    <div class="grid grid-cols-2 gap-3">
      <div class="flex flex-col gap-1.5">
        <Label for="listing-precio">Precio</Label>
        <Input
          id="listing-precio"
          type="number"
          placeholder="0.00"
          bind:value={price}
          min="0.01"
          step="0.01"
          class="border-input bg-card"
        />
      </div>
      <div class="flex flex-col gap-1.5">
        <Label for="listing-cantidad">Cantidad</Label>
        <Input
          id="listing-cantidad"
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
      <Label for="listing-cantidad">Cantidad</Label>
      <Input
        id="listing-cantidad"
        type="number"
        placeholder="1"
        bind:value={quantity}
        min="1"
        step="1"
        class="border-input bg-card"
      />
    </div>
  {/if}

  <!-- Country & City row -->
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

  <!-- Currency row -->
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
      <Label for="listing-trade-description">
        Descripción del intercambio
        <span class="text-xs text-muted-foreground">(Opcional)</span>
      </Label>
      <Textarea
        id="listing-trade-description"
        bind:value={tradeDescription}
        placeholder="(Busco cromos especiales) (Cambio por 3 cromos) etc"
        class="border-input bg-card"
      />
    </div>
  {/if}

  {#if submitError}
    <p class="text-sm text-destructive">{submitError}</p>
  {/if}
</form>
