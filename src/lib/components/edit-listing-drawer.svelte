<script lang="ts">
  import { fade } from "svelte/transition";
  import { expoOut } from "svelte/easing";
  import { closeOnEscapeHandler, lockScroll } from "$lib/utils";
  import { Button } from "$lib/components/ui/button/index.js";
  import EditListingForm from "$lib/components/edit-listing-form.svelte";
  import XIcon from "@lucide/svelte/icons/x";
  import type { SellerListingForSettings } from "$convex/listings";

  type Props = {
    listing: SellerListingForSettings;
    open?: boolean;
  };

  let { listing, open = $bindable(false) }: Props = $props();

  let isSubmitting = $state(false);

  const closeOnEscape = closeOnEscapeHandler(() => open, close);

  function close() {
    if (isSubmitting) return;
    open = false;
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

{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    transition:fade={{ duration: 200 }}
    onclick={close}
    {@attach lockScroll}
  ></div>
{/if}

{#if open}
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="edit-listing-drawer-title"
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
      <h2 id="edit-listing-drawer-title" class="text-base font-semibold">
        Editar publicación
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
      <EditListingForm
        id="edit-listing-form"
        {listing}
        bind:submitting={isSubmitting}
        onSuccess={close}
      />
    </div>

    <!-- Footer -->
    <div
      class="flex items-center justify-end gap-2 border-t border-border px-6 py-4"
    >
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
        form="edit-listing-form"
        disabled={isSubmitting}
        class="duration-150 active:scale-[0.96]"
      >
        {isSubmitting ? "Guardando" : "Guardar cambios"}
      </Button>
    </div>
  </div>
{/if}
