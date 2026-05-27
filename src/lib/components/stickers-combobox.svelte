<script lang="ts">
  import { tick } from "svelte";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import type { Sticker } from "$convex/stickers";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { cn } from "$lib/utils";

  type Props = {
    stickers: Sticker[];
    placeholder?: string;
    emptyMessage?: string;
    value?: Sticker["_id"] | null;
  };

  const MIN_SEARCH_LENGTH = 3;
  const MAX_VISIBLE_OPTIONS = 50;

  let {
    stickers,
    placeholder = "Selecciona un cromo",
    emptyMessage = "No se encontraron stickers.",
    value = $bindable<Sticker["_id"] | null>(null),
  }: Props = $props();

  let open = $state(false);
  let search = $state("");
  let triggerRef = $state<HTMLElement | null>(null);

  function normalizeSearchValue(value: string) {
    return value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  }

  const options = $derived(
    stickers.map((sticker) => ({
      id: sticker._id,
      label: `${sticker.code} - ${sticker.label}`,
      normalizedCode: normalizeSearchValue(sticker.code),
      normalizedLabel: normalizeSearchValue(sticker.label),
    })),
  );

  const normalizedSearch = $derived(normalizeSearchValue(search));
  const hasEnoughSearch = $derived(
    normalizedSearch.length >= MIN_SEARCH_LENGTH,
  );

  const visibleOptions = $derived.by(() => {
    if (!hasEnoughSearch) {
      return [];
    }

    const rankedOptions: Array<{
      option: (typeof options)[number];
      rank: number;
    }> = [];

    for (const option of options) {
      let rank = -1;

      if (option.normalizedCode.startsWith(normalizedSearch)) {
        rank = 0;
      } else if (option.normalizedLabel.startsWith(normalizedSearch)) {
        rank = 1;
      } else if (option.normalizedCode.includes(normalizedSearch)) {
        rank = 2;
      } else if (option.normalizedLabel.includes(normalizedSearch)) {
        rank = 3;
      }

      if (rank !== -1) {
        rankedOptions.push({ option, rank });
      }
    }

    return rankedOptions
      .sort(
        (a, b) =>
          a.rank - b.rank || a.option.label.localeCompare(b.option.label),
      )
      .slice(0, MAX_VISIBLE_OPTIONS)
      .map(({ option }) => option);
  });

  const emptyStateMessage = $derived(
    hasEnoughSearch
      ? emptyMessage
      : `Escribe al menos ${MIN_SEARCH_LENGTH} caracteres para buscar`,
  );

  const selectedOption = $derived(
    options.find((option) => option.id === value) ?? null,
  );

  async function selectSticker(stickerId: Sticker["_id"]) {
    value = stickerId;
    open = false;
    search = "";
    await tick();
    triggerRef?.focus();
  }

  function handleOpenChange(nextOpen: boolean) {
    open = nextOpen;

    if (!nextOpen) {
      search = "";
    }
  }
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
  <Popover.Trigger class="hover:bg-card active:bg-card">
    {#snippet child({ props })}
      <Button
        {...props}
        bind:ref={triggerRef}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        class={cn(
          "h-11 w-full justify-between rounded-3xl border-input bg-card px-4 font-normal hover:bg-card active:bg-card",
          !selectedOption && "text-muted-foreground",
        )}
        disabled={stickers.length === 0}
      >
        <span class="truncate">{selectedOption?.label ?? placeholder}</span>
        <ChevronsUpDownIcon class="size-4 shrink-0 opacity-50" />
      </Button>
    {/snippet}
  </Popover.Trigger>

  <Popover.Content class="w-(--bits-popover-anchor-width) p-1" align="start">
    <Command.Root label="Seleccionar cromo" shouldFilter={false}>
      <Command.Input bind:value={search} placeholder="Buscar sticker" />
      <Command.List>
        <Command.Empty>{emptyStateMessage}</Command.Empty>

        {#each visibleOptions as option (option.id)}
          <Command.Item
            value={option.label}
            onSelect={() => selectSticker(option.id)}
            class="gap-3 [&_.cn-command-item-indicator]:hidden"
          >
            <CheckIcon
              class={cn(
                "size-4 text-foreground transition-opacity",
                value === option.id ? "opacity-100" : "opacity-0",
              )}
            />
            <span class="truncate">{option.label}</span>
          </Command.Item>
        {/each}
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
