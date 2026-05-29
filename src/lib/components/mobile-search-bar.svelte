<script lang="ts">
  import { Search, X } from "@lucide/svelte";
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
    params.q = "";
    expanded = false;
  }
</script>

<!-- Collapsed trigger button — mobile only -->
<button
  type="button"
  aria-label="Search"
  onclick={() => (expanded = true)}
  class="flex items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.96] md:hidden"
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
      bind:value={params.q}
      type="search"
      placeholder={m.nav_search_placeholder()}
      class="flex-1 border-transparent bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
      onkeydown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      {@attach focusOnMount}
    />

    <button
      type="button"
      onclick={collapse}
      class="flex shrink-0 items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.96]"
      aria-label="Cerrar búsqueda"
    >
      <X class="size-4" />
    </button>
  </div>
{/if}
