<script lang="ts">
  import { Search } from "@lucide/svelte";
  import { fade } from "svelte/transition";
  import { useSearchParams } from "runed/kit";
  import { listingSearchParamsSchema } from "$lib/schemas";
  import * as m from "$lib/paraglide/messages";

  let expanded = $state(false);

  const params = useSearchParams(listingSearchParamsSchema, {
    noScroll: true,
    pushHistory: false,
  });

  function focusOnMount(el: HTMLInputElement) {
    el.focus();
  }

  function collapse() {
    expanded = false;
  }
</script>

<!-- Collapsed trigger button — mobile only -->
<button
  type="button"
  aria-label="Search"
  onclick={() => (expanded = true)}
  class="md:hidden flex items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.96]"
>
  <Search class="size-5" />
</button>

<!-- Expanded overlay -->
{#if expanded}
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 border-b bg-background px-4 backdrop-blur-sm"
  >
    <Search class="size-4 shrink-0 text-muted-foreground" />

    <input
      {@attach focusOnMount}
      bind:value={params.q}
      type="search"
      placeholder={m.nav_search_placeholder()}
      class="flex-1 border-transparent bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
    />

    <button
      type="button"
      onclick={collapse}
      class="shrink-0 text-sm font-medium text-primary"
    >
      Cancelar
    </button>
  </div>
{/if}
