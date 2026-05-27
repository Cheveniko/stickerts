<script lang="ts">
  import { page } from "$app/state";
  import { fade } from "svelte/transition";
  import { expoOut } from "svelte/easing";
  import { closeOnEscapeHandler, lockScroll } from "$lib/utils";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import ImageUploader from "$lib/components/image-uploader.svelte";
  import StickersCombobox from "$lib/components/stickers-combobox.svelte";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import XIcon from "@lucide/svelte/icons/x";
  import {
    CITIES_BY_COUNTRY_CODE,
    COUNTRIES,
    CURRENCIES,
  } from "$lib/location-data";
  import type { Sticker } from "$convex/stickers";
  import type { CurrentSeller } from "$convex/sellers";

  type Props = {
    seller: CurrentSeller;
  };

  const { seller }: Props = $props();

  let imageFile = $state<File | null>(null);
  let selectedStickerId = $state<Sticker["_id"] | null>(null);
  let price = $state<number | null>(null);
  let quantity = $state<number>(1);
  let selectedCountryCode = $derived(seller.city?.countryCode ?? "");
  let selectedCitySlug = $derived(seller.city?.slug ?? "");
  let selectedCurrency = $derived(
    seller.defaultCurrency ?? seller.city?.currency ?? "",
  );

  let open = $state(false);
  const stickers = $derived<Sticker[]>(page.data.stickers ?? []);

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

  const closeOnEscape = closeOnEscapeHandler(() => open, close);

  function close() {
    open = false;
  }

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

  function slideRight(
    _node: Element,
    { duration = 380 }: { duration?: number } = {},
  ) {
    return {
      duration,
      easing: expoOut,
      css: (t: number) => `transform: translateX(${(1 - t) * 100}%)`,
    };
  }
</script>

<svelte:window onkeydown={closeOnEscape} />

<!-- FAB Button -->
<button
  aria-label="Publicar cromo"
  class="fixed right-6 bottom-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-[transform,box-shadow,filter] duration-150 hover:scale-[1.04] hover:brightness-105 active:scale-[0.96]"
  onclick={() => (open = true)}
>
  <PlusIcon class="size-6" />
</button>

<!-- Backdrop -->
{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    transition:fade={{ duration: 200 }}
    onclick={close}
    {@attach lockScroll}
  ></div>
{/if}

<!-- Drawer Panel -->
{#if open}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="new-listing-drawer-title"
    tabindex="-1"
    class="fixed top-0 right-0 bottom-0 z-50 flex w-full flex-col border-l border-border bg-popover shadow-2xl sm:w-[420px]"
    transition:slideRight={{ duration: 500 }}
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-border px-6 py-5"
    >
      <h2 id="new-listing-drawer-title" class="text-base font-semibold">
        Publicar cromo
      </h2>
      <button
        aria-label="Cerrar"
        class="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
        onclick={close}
      >
        <XIcon class="size-4" />
      </button>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto px-6 py-6">
      <div class="flex flex-col gap-5">
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
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="listing-cantidad">Cantidad</Label>
            <Input
              id="listing-cantidad"
              type="number"
              placeholder="1"
              bind:value={quantity}
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
              <Select.Trigger
                class="h-9 w-full border-input bg-background text-sm"
              >
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
              <Select.Trigger
                class="h-9 w-full border-input bg-background text-sm"
              >
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
            <Select.Trigger
              class="h-9 w-full border-input bg-background text-sm"
            >
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
      </div>
    </div>

    <!-- Footer -->
    <div
      class="flex items-center justify-end gap-2 border-t border-border px-6 py-4"
    >
      <Button
        variant="ghost"
        class="border border-border duration-150 active:scale-[0.96]"
        onclick={close}
      >
        Cancelar
      </Button>
      <Button class="duration-150 active:scale-[0.96]">Publicar</Button>
    </div>
  </div>
{/if}
