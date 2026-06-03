<script lang="ts">
  import { tick } from "svelte";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
  import XIcon from "@lucide/svelte/icons/x";
  import type { Sticker } from "$convex/stickers";
  import { Button } from "$lib/components/ui/button/index.js";
  import * as Command from "$lib/components/ui/command/index.js";
  import * as Popover from "$lib/components/ui/popover/index.js";
  import { cn } from "$lib/utils";
  import * as m from "$lib/paraglide/messages";

  type Props = {
    stickers: Sticker[];
    placeholder?: string;
    emptyMessage?: string;
    value?: Sticker["_id"][];
  };

  const MIN_SEARCH_LENGTH = 3;
  const MAX_VISIBLE_OPTIONS = 50;

  let {
    stickers,
    placeholder = m.listing_search_stickers(),
    emptyMessage = m.listing_no_stickers_found(),
    value = $bindable<Sticker["_id"][]>([]),
  }: Props = $props();

  let open = $state(false);
  let search = $state("");
  let triggerRef = $state<HTMLElement | null>(null);

  function normalizeSearchValue(val: string) {
    return val
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
      : m.stickers_search_min({ count: MIN_SEARCH_LENGTH }),
  );

  const selectedOptions = $derived(
    options.filter((option) => value.includes(option.id)),
  );

  const triggerLabel = $derived(
    value.length === 0
      ? placeholder
      : value.length === 1
        ? m.stickers_multicombobox_selected_one()
        : m.stickers_multicombobox_selected_many({ count: value.length }),
  );

  function isSelected(id: Sticker["_id"]) {
    return value.includes(id);
  }

  async function toggleSticker(stickerId: Sticker["_id"]) {
    if (isSelected(stickerId)) {
      value = value.filter((id) => id !== stickerId);
    } else {
      value = [...value, stickerId];
    }
    await tick();
  }

  function removeSticker(stickerId: Sticker["_id"]) {
    value = value.filter((id) => id !== stickerId);
  }

  function handleOpenChange(nextOpen: boolean) {
    open = nextOpen;

    if (!nextOpen) {
      search = "";
    }
  }
</script>

<div class="flex flex-col gap-2">
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
            value.length === 0 && "text-muted-foreground",
          )}
          disabled={stickers.length === 0}
        >
          <span class="truncate">{triggerLabel}</span>
          <ChevronsUpDownIcon class="size-4 shrink-0 opacity-50" />
        </Button>
      {/snippet}
    </Popover.Trigger>

    <Popover.Content class="w-(--bits-popover-anchor-width) p-1" align="start">
      <Command.Root
        label={m.stickers_multicombobox_label()}
        shouldFilter={false}
      >
        <Command.Input
          bind:value={search}
          placeholder={m.common_search_sticker()}
        />
        <Command.List>
          <Command.Empty>{emptyStateMessage}</Command.Empty>

          {#each visibleOptions as option (option.id)}
            <Command.Item
              value={option.label}
              onSelect={() => toggleSticker(option.id)}
              class="gap-3 [&_.cn-command-item-indicator]:hidden"
            >
              <CheckIcon
                class={cn(
                  "size-4 text-foreground transition-opacity",
                  isSelected(option.id) ? "opacity-100" : "opacity-0",
                )}
              />
              <span class="truncate">{option.label}</span>
            </Command.Item>
          {/each}
        </Command.List>
      </Command.Root>
    </Popover.Content>
  </Popover.Root>

  {#if selectedOptions.length > 0}
    <div class="flex flex-wrap gap-1.5">
      {#each selectedOptions as option (option.id)}
        <span
          class="inline-flex h-7 items-center gap-1 rounded-3xl border border-input bg-card px-2.5 py-0.5 text-sm text-foreground"
        >
          <span class="max-w-48 truncate">{option.label}</span>
          <button
            type="button"
            onclick={() => removeSticker(option.id)}
            class="ml-0.5 rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-label={m.stickers_multicombobox_remove({
              label: option.label,
            })}
          >
            <XIcon class="size-3" />
          </button>
        </span>
      {/each}
    </div>
  {/if}
</div>
