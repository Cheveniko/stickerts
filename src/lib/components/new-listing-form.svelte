<script lang="ts">
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import ImageUploader from "$lib/components/image-uploader.svelte";
  import StickersCombobox from "$lib/components/stickers-combobox.svelte";
  import {
    CITIES_BY_COUNTRY_CODE,
    COUNTRIES,
    CURRENCIES,
  } from "$lib/location-data";
  import type { Sticker } from "$convex/stickers";
  import type { CurrentSeller } from "$convex/sellers";
  import { page } from "$app/state";

  type Props = {
    id?: string;
    seller: CurrentSeller;
  };

  const { id, seller }: Props = $props();

  const stickers = $derived<Sticker[]>(page.data.stickers ?? []);
  let imageFile = $state<File | null>(null);
  let selectedStickerId = $state<Sticker["_id"] | null>(null);
  let price = $state<number | null>(null);
  let quantity = $state(1);
  let selectedCountryCode = $derived(seller.city?.countryCode ?? "");
  let selectedCitySlug = $derived(seller.city?.slug ?? "");
  let selectedCurrency = $derived(
    seller.defaultCurrency ?? seller.city?.currency ?? "",
  );

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

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    // TODO: implement listing submission
  }
</script>

<form {id} onsubmit={handleSubmit} class="flex flex-col gap-5">
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

  <!-- Price & Quantity row -->
  <div class="grid grid-cols-2 gap-3">
    <div class="flex flex-col gap-1.5">
      <Label for="listing-precio">Precio</Label>
      <Input
        id="listing-precio"
        type="number"
        placeholder="0.00"
        bind:value={price}
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
        class="border-input bg-card"
      />
    </div>
  </div>

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
</form>
