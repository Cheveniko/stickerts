<script lang="ts">
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { expoOut } from "svelte/easing";
  import { closeOnEscapeHandler, lockScroll } from "$lib/utils";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Switch } from "$lib/components/ui/switch/index.js";
  import NewListingForm from "$lib/components/new-listing-form.svelte";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import XIcon from "@lucide/svelte/icons/x";
  import type { CurrentSeller } from "$convex/sellers";

  type Props = {
    seller: CurrentSeller;
  };

  const { seller }: Props = $props();

  let open = $state(false);
  let isSubmitting = $state(false);
  let publishMore = $state(false);
  let bottomOffset = $state(24);

  const closeOnEscape = closeOnEscapeHandler(() => open, close);

  function close() {
    if (isSubmitting) return;
    open = false;
  }

  function onFormSuccess() {
    if (!publishMore) close();
  }

  onMount(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    function updateOffset() {
      const rect = footer!.getBoundingClientRect();
      const footerVisible = Math.max(0, window.innerHeight - rect.top);
      bottomOffset = footerVisible + 24;
    }

    window.addEventListener("scroll", updateOffset, { passive: true });
    updateOffset();

    return () => {
      window.removeEventListener("scroll", updateOffset);
    };
  });

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
  class="fixed right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-[transform,box-shadow,filter] duration-150 hover:scale-[1.04] hover:brightness-105 active:scale-[0.96]"
  style="bottom: {bottomOffset}px"
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
        disabled={isSubmitting}
        class="flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
        onclick={close}
      >
        <XIcon class="size-4" />
      </button>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto px-6 py-6">
      <NewListingForm
        id="new-listing-form"
        {seller}
        bind:submitting={isSubmitting}
        onSuccess={onFormSuccess}
      />
    </div>

    <!-- Footer -->
    <div
      class="flex items-center justify-between border-t border-border px-6 py-4"
    >
      <label class="flex cursor-pointer items-center gap-2 text-sm select-none">
        <Switch size="sm" bind:checked={publishMore} disabled={isSubmitting} />
        Publicar más
      </label>

      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          disabled={isSubmitting}
          class="border border-border duration-150 active:scale-[0.96]"
          onclick={close}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="new-listing-form"
          disabled={isSubmitting}
          class="duration-150 active:scale-[0.96]"
        >
          {isSubmitting ? "Publicando" : "Publicar"}
        </Button>
      </div>
    </div>
  </div>
{/if}
