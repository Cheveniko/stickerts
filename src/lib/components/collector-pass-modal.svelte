<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { closeOnEscapeHandler, lockScroll } from "$lib/utils";
  import { Button } from "$lib/components/ui/button/index.js";
  import CheckIcon from "@lucide/svelte/icons/check";
  import TicketIcon from "@lucide/svelte/icons/ticket";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import XIcon from "@lucide/svelte/icons/x";

  type Props = { open: boolean };
  let { open = $bindable() }: Props = $props();

  const benefits = [
    "Contáctate con los dueños de cromos",
    "Publica cromos en venta e intercambio",
    "Recibe mensajes directos de compradores",
  ];

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
      aria-labelledby="collector-pass-modal-title"
      tabindex="-1"
      class="pointer-events-auto relative w-full max-w-sm rounded-4xl bg-popover shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Close button -->
      <button
        aria-label="Cerrar"
        class="absolute top-3.5 right-3.5 z-10 flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
        onclick={close}
      >
        <XIcon class="size-4" />
      </button>

      <div class="flex flex-col gap-6 p-6">
        <!-- Header -->
        <div class="flex flex-col items-center gap-3 pt-1 text-center">
          <div
            class="flex size-14 items-center justify-center rounded-3xl bg-primary/10"
          >
            <TicketIcon
              class="size-7 text-primary"
              style="transform: rotate(-45deg)"
            />
          </div>
          <div class="flex flex-col gap-1">
            <h2
              id="collector-pass-modal-title"
              class="text-lg font-semibold text-balance"
            >
              Pase de Coleccionista
            </h2>
            <p class="text-sm text-pretty text-muted-foreground">
              Todo lo que necesitas para vender e intercambiar cromos en
              Stickerts.
            </p>
          </div>
        </div>

        <!-- Benefits list -->
        <ul class="flex flex-col gap-2.5">
          {#each benefits as benefit (benefit)}
            <li class="flex items-start gap-3">
              <div
                class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10"
              >
                <CheckIcon class="size-3 text-primary" />
              </div>
              <span class="text-sm leading-relaxed">{benefit}</span>
            </li>
          {/each}
        </ul>

        <!-- Price section -->
        <div class="rounded-xl bg-muted/60 px-4 py-3.5">
          <div class="flex items-center justify-between gap-4">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs text-muted-foreground">Pago único</span>
              <div class="flex items-baseline gap-1.5">
                <span class="text-2xl font-bold tabular-nums">$1.99</span>
                <span class="text-sm text-muted-foreground">USD</span>
              </div>
            </div>
            <div
              class="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-medium ring-1 ring-black/5 dark:ring-white/10"
            >
              <SparklesIcon class="size-3" />
              Acceso todo el 2026
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="flex flex-col gap-2">
          <Button class="w-full duration-150 active:scale-[0.96]" disabled>
            Pagar con PayPal
          </Button>
          <p class="text-center text-xs text-pretty text-muted-foreground">
            Integración de pago próximamente disponible.
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}
