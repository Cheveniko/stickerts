<script lang="ts">
  import { api } from "$convex/_generated/api";
  import PencilLineIcon from "@lucide/svelte/icons/pencil-line";
  import type { CurrentSeller } from "$convex/sellers";
  import { getConvexErrorMessage } from "$lib/convex-errors";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import {
    CITIES_BY_COUNTRY_CODE,
    COUNTRIES,
    CURRENCIES,
  } from "$lib/location-data";
  import { useConvexClient } from "convex-svelte";

  type Props = { seller: CurrentSeller };

  let { seller }: Props = $props();
  const convex = useConvexClient();

  let isEditingUsername = $state(false);
  let isSavingUsername = $state(false);
  let isSavingCity = $state(false);
  let isSavingCurrency = $state(false);
  let usernameError = $state("");
  let cityError = $state("");
  let currencyError = $state("");
  let usernameValue = $derived(seller.username ?? "");
  let selectedCountryCode = $derived(seller.city?.countryCode ?? "");
  let selectedCitySlug = $derived(seller.city?.slug ?? "");
  let selectedCurrency = $derived(
    seller.defaultCurrency ?? seller.city?.currency ?? "",
  );

  function startEditingUsername() {
    usernameValue = seller.username ?? "";
    usernameError = "";
    isEditingUsername = true;
  }

  async function saveUsername() {
    if (isSavingUsername) return;

    usernameError = "";

    const normalizedUsername = usernameValue.trim().toLowerCase();
    if (normalizedUsername === seller.username) {
      usernameValue = seller.username;
      isEditingUsername = false;
      return;
    }

    isSavingUsername = true;

    try {
      await convex.mutation(api.sellers.updateCurrentSellerUsername, {
        username: usernameValue,
      });
      isEditingUsername = false;
    } catch (error) {
      usernameError = getConvexErrorMessage(error);
    } finally {
      isSavingUsername = false;
    }
  }

  function cancelUsername() {
    if (isSavingUsername) return;

    isEditingUsername = false;
    usernameError = "";
    usernameValue = seller.username ?? "";
  }

  function onCountryChange(value: string | undefined) {
    if (!value) return;
    selectedCountryCode = value;
    selectedCitySlug = "";

    const country = COUNTRIES.find((entry) => entry.code === value);
    if (country) selectedCurrency = country.currency;
  }

  async function onCityChange(value: string | undefined) {
    if (!value) return;

    cityError = "";
    selectedCitySlug = value;

    const city = availableCities.find((entry) => entry.slug === value);
    if (city) selectedCurrency = city.currency;

    if (isSavingCity || seller.city?.slug === value) {
      return;
    }

    isSavingCity = true;

    try {
      await convex.mutation(api.sellers.updateCurrentSellerDefaultCity, {
        citySlug: value,
      });
    } catch (error) {
      cityError = getConvexErrorMessage(error);
      selectedCountryCode = seller.city?.countryCode ?? "";
      selectedCitySlug = seller.city?.slug ?? "";
      selectedCurrency = seller.defaultCurrency ?? seller.city?.currency ?? "";
    } finally {
      isSavingCity = false;
    }
  }

  async function onCurrencyChange(value: string | undefined) {
    if (!value) return;

    currencyError = "";
    selectedCurrency = value;

    if (seller.defaultCurrency === value || isSavingCurrency) {
      return;
    }

    isSavingCurrency = true;

    try {
      await convex.mutation(api.sellers.updateCurrentSellerDefaultCurrency, {
        defaultCurrency: value,
      });
    } catch (error) {
      currencyError = getConvexErrorMessage(error);
      selectedCurrency = seller.defaultCurrency ?? seller.city?.currency ?? "";
    } finally {
      isSavingCurrency = false;
    }
  }

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
</script>

<div class="flex flex-col gap-4">
  <div>
    <p class="text-sm font-medium text-muted-foreground">Perfil de vendedor</p>
    {#if isEditingUsername}
      <input
        bind:value={usernameValue}
        placeholder="tu_usuario"
        disabled={isSavingUsername}
        onblur={saveUsername}
        onkeydown={(e) => {
          if (e.key === "Enter") saveUsername();
          if (e.key === "Escape") cancelUsername();
        }}
        class="-mx-1 mt-0.5 w-full min-w-0 rounded-sm border-0 bg-transparent px-1 py-0.5 font-semibold ring-1 ring-ring outline-none xs:text-sm"
        {@attach (node) => node.focus()}
      />
    {:else}
      <button
        disabled={isSavingUsername}
        onclick={startEditingUsername}
        class="-mx-1 mt-0.5 flex w-full cursor-text items-center gap-1.5 rounded-sm px-1 py-0.5 text-left transition-colors hover:bg-accent/50"
      >
        <span class="block truncate text-sm font-semibold">
          @{usernameValue || seller.username}
        </span>
        <PencilLineIcon class="h-3 w-3 shrink-0 text-muted-foreground" />
      </button>
    {/if}

    {#if usernameError}
      <p class="mt-1 text-sm text-destructive">{usernameError}</p>
    {/if}
  </div>

  <div class="grid grid-cols-2 gap-3">
    <div class="grid gap-1.5">
      <Label>País</Label>
      <Select.Root
        type="single"
        value={selectedCountryCode}
        onValueChange={onCountryChange}
        disabled={isSavingCity}
      >
        <Select.Trigger class="h-8 w-full border-input bg-card text-sm">
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

    <div class="grid gap-1.5">
      <Label>Ciudad</Label>
      <Select.Root
        type="single"
        value={selectedCitySlug}
        onValueChange={onCityChange}
        disabled={!selectedCountryCode || isSavingCity}
      >
        <Select.Trigger class="h-8 w-full border-input bg-card text-sm">
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

      {#if cityError}
        <p class="text-sm text-destructive">{cityError}</p>
      {/if}
    </div>
  </div>

  <div class="grid gap-1.5">
    <Label>Moneda predeterminada</Label>
    <Select.Root
      type="single"
      value={selectedCurrency}
      onValueChange={onCurrencyChange}
      disabled={isSavingCurrency}
    >
      <Select.Trigger class="h-8 w-full border-input bg-card text-sm">
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

    {#if currencyError}
      <p class="text-sm text-destructive">{currencyError}</p>
    {/if}
  </div>
</div>
