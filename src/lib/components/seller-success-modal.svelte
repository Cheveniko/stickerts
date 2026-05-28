<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { closeOnEscapeHandler, lockScroll } from "$lib/utils";
  import { Button } from "$lib/components/ui/button/index.js";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import XIcon from "@lucide/svelte/icons/x";

  type Props = { open: boolean };
  let { open = $bindable() }: Props = $props();

  function close() {
    open = false;
  }

  const closeOnEscape = closeOnEscapeHandler(() => open, close);
</script>

<svelte:window onkeydown={closeOnEscape} />

{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    transition:fade={{ duration: 180 }}
    onclick={close}
    {@attach lockScroll}
  ></div>
{/if}

{#if open}
  <div
    class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
    transition:fly={{ y: 14, duration: 280, easing: cubicOut }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="seller-success-modal-title"
      tabindex="-1"
      class="pointer-events-auto relative flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-4xl bg-popover shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Close button -->
      <button
        aria-label="Cerrar"
        class="absolute top-3.5 right-3.5 z-10 flex size-10 shrink-0 items-center justify-center rounded-2xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
        onclick={close}
      >
        <XIcon class="size-4" />
      </button>

      <div class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        <!-- Header -->
        <div
          class="flex flex-col items-center gap-3 pt-1 text-center"
          in:fly={{ y: 12, duration: 250, delay: 0, easing: cubicOut }}
        >
          <div
            class="flex size-14 items-center justify-center rounded-3xl bg-primary"
          >
            <SparklesIcon class="size-7 text-primary-foreground" />
          </div>
          <div class="flex flex-col gap-1">
            <h2
              id="seller-success-modal-title"
              class="text-lg font-semibold text-balance"
            >
              ¡Tu Pase de Coleccionista está activo!
            </h2>
            <p class="text-sm text-pretty text-muted-foreground">
              Ya puedes publicar, vender e intercambiar cromos en Stickerts.
            </p>
          </div>
        </div>

        <!-- Tip box -->
        <div
          class="rounded-xl bg-muted/60 px-4 py-3.5"
          in:fly={{ y: 12, duration: 250, delay: 160, easing: cubicOut }}
        >
          <p class="text-center text-sm text-pretty text-muted-foreground">
            Configura tu nombre, ciudad y moneda en
            <strong class="font-medium text-foreground">
              Ajustes → Perfil
            </strong>
            antes de publicar tu primer cromo.
          </p>
        </div>

        <!-- CTA -->
        <div in:fly={{ y: 12, duration: 250, delay: 220, easing: cubicOut }}>
          <Button
            variant="default"
            type="button"
            class="w-full transition-[background-color,transform] duration-150 active:scale-[0.96]"
            onclick={close}
          >
            Entendido
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}
