<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { env } from "$env/dynamic/public";
  import { api } from "$convex/_generated/api";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import {
    getErrorMessage,
    paypalButtonsAttachment,
    type CollectorPassState,
    type PayPalOnApproveData,
  } from "$lib/paypal";
  import { closeOnEscapeHandler, lockScroll } from "$lib/utils";
  import { Button } from "$lib/components/ui/button/index.js";
  import CheckIcon from "@lucide/svelte/icons/check";
  import TicketIcon from "@lucide/svelte/icons/ticket";
  import SparklesIcon from "@lucide/svelte/icons/sparkles";
  import XIcon from "@lucide/svelte/icons/x";
  import { onDestroy } from "svelte";
  import { useConvexClient } from "convex-svelte";

  type Props = { open: boolean; onsuccess?: () => void };
  let { open = $bindable(), onsuccess }: Props = $props();
  const convex = useConvexClient();

  const benefits = [
    "Contáctate con los dueños de cromos",
    "Publica cromos en venta e intercambio",
    "Recibe mensajes directos de compradores",
  ];

  const CLOSE_TRANSITION_MS = 300;

  let checkoutState = $state<CollectorPassState>({ kind: "idle" });

  let closeTimeout: ReturnType<typeof setTimeout> | null = null;

  let isBusy = $derived(
    checkoutState.kind === "creating_order" ||
      checkoutState.kind === "capturing_order",
  );

  let statusMessage = $derived.by(() => {
    switch (checkoutState.kind) {
      case "initializing_paypal":
        return "Cargando PayPal";
      case "creating_order":
        return "Preparando tu orden";
      case "capturing_order":
        return "Confirmando tu pago";
      case "ready":
        return "Paga de forma segura con PayPal.";
      case "success":
        return "¡Pago completado! Tu Pase de Coleccionista ya está activo.";
      case "error":
        return checkoutState.message;
      default:
        return "";
    }
  });

  function clearCloseTimeout() {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = null;
    }
  }

  function canDismiss() {
    return !isBusy;
  }

  function close() {
    if (!canDismiss()) {
      return;
    }

    clearCloseTimeout();
    open = false;
    closeTimeout = setTimeout(() => {
      closeTimeout = null;

      if (!open) {
        checkoutState = { kind: "idle" };
      }
    }, CLOSE_TRANSITION_MS);
  }

  function retry() {
    if (!open || isBusy) {
      return;
    }

    checkoutState = { kind: "idle" };
  }

  async function createOrder() {
    checkoutState = { kind: "creating_order" };

    try {
      const result = await convex.action(
        api.collectorPassPurchases.createCollectorPassOrder,
        {},
      );

      checkoutState = { kind: "ready" };
      return result.orderId;
    } catch (error) {
      checkoutState = {
        kind: "error",
        source: "checkout",
        message: getErrorMessage(
          error,
          "No pudimos crear tu orden de PayPal. Intenta de nuevo.",
        ),
      };
      throw error;
    }
  }

  async function onApprove(data: PayPalOnApproveData) {
    checkoutState = { kind: "capturing_order" };

    try {
      await convex.action(
        api.collectorPassPurchases.captureCollectorPassOrder,
        {
          paypalOrderId: data.orderID,
        },
      );

      checkoutState = { kind: "success" };
      onsuccess?.();
      close();

      try {
        await invalidateAll();
      } catch (error) {
        console.error(
          "[collector-pass-modal] Failed to refresh page data",
          error,
        );
      }
    } catch (error) {
      checkoutState = {
        kind: "error",
        source: "checkout",
        message: getErrorMessage(
          error,
          "No pudimos confirmar tu pago. Si PayPal mostró un cobro, contacta soporte.",
        ),
      };
      throw error;
    }
  }

  function onPayPalError(error: unknown) {
    if (checkoutState.kind === "error") {
      return;
    }

    checkoutState = {
      kind: "error",
      source: "checkout",
      message: getErrorMessage(
        error,
        "Ocurrió un error con PayPal. Intenta de nuevo.",
      ),
    };
  }

  function safelyResetPayPalState() {
    if (
      checkoutState.kind !== "success" &&
      checkoutState.kind !== "error" &&
      checkoutState.kind !== "capturing_order"
    ) {
      checkoutState = { kind: "ready" };
    }
  }

  const closeOnEscape = closeOnEscapeHandler(() => open, close);

  onDestroy(() => {
    clearCloseTimeout();
  });
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
      class="pointer-events-auto relative flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-4xl bg-popover shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- Close button -->
      <button
        aria-label="Cerrar"
        class="absolute top-3.5 right-3.5 z-10 flex size-10 shrink-0 items-center justify-center rounded-2xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
        disabled={isBusy}
        aria-disabled={isBusy}
        onclick={close}
      >
        <XIcon class="size-4" />
      </button>

      <div class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
        <!-- Header -->
        <div class="flex flex-col items-center gap-3 pt-1 text-center">
          <div
            class="flex size-14 items-center justify-center rounded-full bg-primary dark:bg-primary/10"
          >
            <TicketIcon
              class="size-7 text-primary-foreground/80 dark:text-primary"
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
                class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary dark:bg-primary/10"
              >
                <CheckIcon
                  class="size-3 text-primary-foreground/80 dark:text-primary"
                />
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
          {#if checkoutState.kind !== "error"}
            <div
              class="min-h-[44px] rounded-2xl"
              {@attach paypalButtonsAttachment({
                clientId: env.PUBLIC_PAYPAL_CLIENT_ID,
                createOrder,
                onApprove,
                onError: onPayPalError,
                onCancel: safelyResetPayPalState,
                onLoading: () => {
                  checkoutState = { kind: "initializing_paypal" };
                },
                onReady: safelyResetPayPalState,
              })}
            ></div>
          {/if}

          {#if checkoutState.kind === "error"}
            <div class="flex flex-col gap-2">
              <p
                role="alert"
                class="text-center text-xs text-pretty text-destructive"
              >
                {statusMessage}
              </p>
              <Button
                type="button"
                variant="outline"
                class="w-full duration-150 active:scale-[0.96]"
                onclick={retry}
              >
                Reintentar
              </Button>
            </div>
          {:else if checkoutState.kind === "creating_order"}
            <p
              aria-live="polite"
              class="text-center text-xs text-pretty text-muted-foreground"
            >
              {statusMessage}
            </p>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
