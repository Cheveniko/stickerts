<script lang="ts">
  import type { ListingWithRelations } from "$convex/listings";
  import { closeOnEscapeHandler } from "$lib/utils";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import MailIcon from "@lucide/svelte/icons/mail";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import ShieldIcon from "@lucide/svelte/icons/shield";
  import GiftIcon from "@lucide/svelte/icons/gift";
  import XIcon from "@lucide/svelte/icons/x";

  type Props = {
    listing: ListingWithRelations;
    open: boolean;
    freeContactsRemaining?: number | null;
  };

  type ContactOption = "whatsapp" | "email" | "phone";

  const MAX_MESSAGE_LENGTH = 500;

  let { listing, open = $bindable(), freeContactsRemaining = null }: Props = $props();

  let selectedOption = $state<ContactOption | null>(null);
  let message = $state("");
  let textareaRef = $state<HTMLTextAreaElement | null>(null);

  const modalSubtitle = $derived(
    listing.intent === "sale"
      ? "Envía tus datos al vendedor para coordinar la compra."
      : listing.intent === "trade"
        ? "Envía tus datos al vendedor para coordinar el intercambio."
        : "Envía tus datos al vendedor para comprar o intercambiar.",
  );

  const messagePrefill = $derived(
    listing.intent === "trade"
      ? (channel: string) =>
          `Hola ${listing.sellerName}, quiero intercambiar mi cromo por el tuyo (${listing.sticker.label}${listing.sticker.code ? ` - ${listing.sticker.code}` : ""}). Por favor contáctame vía ${channel} a: `
      : listing.intent === "sale_or_trade"
        ? (channel: string) =>
            `Hola ${listing.sellerName}, me interesa tu cromo ${listing.sticker.label}${listing.sticker.code ? ` - ${listing.sticker.code}` : ""}. Por favor contáctame vía ${channel} a: `
        : (channel: string) =>
            `Hola ${listing.sellerName}, quiero comprar tu cromo ${listing.sticker.label}${listing.sticker.code ? ` - ${listing.sticker.code}` : ""}. Por favor contáctame vía ${channel} a: `,
  );

  let messageTooLong = $derived(message.length > MAX_MESSAGE_LENGTH);

  const closeOnEscape = closeOnEscapeHandler(() => open, close);

  const contactOptions: {
    id: ContactOption;
    label: string;
    Icon: typeof MessageCircleIcon;
  }[] = [
    { id: "whatsapp", label: "WhatsApp", Icon: MessageCircleIcon },
    { id: "email", label: "Email", Icon: MailIcon },
    { id: "phone", label: "Teléfono", Icon: PhoneIcon },
  ];

  function resetModalState() {
    selectedOption = null;
    message = "";
  }

  function close() {
    open = false;
    setTimeout(() => {
      resetModalState();
    }, 300);
  }

  function selectOption(option: { id: ContactOption; label: string }) {
    selectedOption = option.id;
    const prefill = messagePrefill(option.label);
    message = prefill;

    const len = prefill.length;
    setTimeout(() => {
      textareaRef?.focus();
      textareaRef?.setSelectionRange(len, len);
    }, 0);
  }

  function sendMessage() {
    return;
  }
</script>

<svelte:window onkeydown={closeOnEscape} />

{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    transition:fade={{ duration: 180 }}
    onclick={close}
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
      aria-labelledby="purchase-modal-title"
      tabindex="-1"
      class="pointer-events-auto w-full max-w-md rounded-4xl bg-popover shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="flex flex-col gap-5 p-6">
        <!-- Header row -->
        <div class="flex items-start justify-between gap-4">
          <div class="flex min-w-0 flex-col gap-0.5">
            <h2 id="purchase-modal-title" class="font-semibold text-balance">
              {listing.sticker.code}
              {listing.sticker.label}
            </h2>
            <p class="text-sm text-muted-foreground">
              {modalSubtitle}
            </p>
          </div>
          <button
            aria-label="Cerrar"
            class="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
            onclick={close}
          >
            <XIcon class="size-4" />
          </button>
        </div>

        <!-- Pills section -->
        <div class="flex flex-col gap-2">
          <p class="text-xs font-medium text-muted-foreground">
            ¿Cómo quieres que te contacten?
          </p>
          <div class="flex flex-wrap gap-1.5">
            {#each contactOptions as option (option.id)}
              <button
                class={[
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.96]",
                  selectedOption === option.id
                    ? "bg-foreground text-background"
                    : "border bg-card text-card-foreground hover:bg-muted hover:text-card-foreground",
                ].join(" ")}
                onclick={() => selectOption(option)}
              >
                <option.Icon class="size-3.5" />
                {option.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Textarea -->
        <Textarea
          bind:ref={textareaRef}
          bind:value={message}
          class="min-h-[88px] leading-relaxed placeholder:text-xs"
          placeholder="Escribe un mensaje o selecciona cómo contactarte"
        />

        {#if messageTooLong}
          <p class="text-xs text-destructive">
            Máximo 500 caracteres permitidos.
          </p>
        {/if}

        <div class="flex flex-col gap-1.5">
          <div
            class="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
          >
            <ShieldIcon class="mt-0.5 size-3.5 shrink-0 text-foreground/70" />
            <p class="text-pretty">
              Asegúrate de coordinar la transacción en un lugar público.
            </p>
          </div>

          {#if freeContactsRemaining !== null && freeContactsRemaining > 0}
            <div
              class="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
              transition:fade={{ duration: 150 }}
            >
              <GiftIcon class="mt-0.5 size-3.5 shrink-0 text-foreground/70" />
              <p class="text-pretty">
                Usarás tu contacto gratuito con vendedores.
              </p>
            </div>
          {/if}
        </div>

        <div class="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            class="border border-border duration-150 active:scale-[0.96]"
            onclick={close}
          >
            Cancelar
          </Button>
          <Button
            class="duration-150 hover:bg-primary hover:brightness-105 active:scale-[0.96]"
            onclick={sendMessage}
          >
            Enviar mensaje
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}
