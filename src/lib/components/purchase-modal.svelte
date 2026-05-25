<script lang="ts">
  import { browser } from "$app/environment";
  import { api } from "$convex/_generated/api";
  import type { ListingWithRelations } from "$convex/listings";
  import { useConvexClient } from "convex-svelte";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import MailIcon from "@lucide/svelte/icons/mail";
  import PhoneIcon from "@lucide/svelte/icons/phone";
  import ShieldIcon from "@lucide/svelte/icons/shield";
  import XIcon from "@lucide/svelte/icons/x";

  type Props = {
    listing: ListingWithRelations;
    open: boolean;
  };

  type ContactOption = "whatsapp" | "email" | "phone";

  const MAX_MESSAGE_LENGTH = 500;
  const LISTING_INQUIRY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const ANONYMOUS_CLIENT_ID_KEY = "stickerts:anonymous-client-id";
  const LISTING_COOLDOWNS_KEY = "stickerts:listing-inquiry-cooldowns";

  let { listing, open = $bindable() }: Props = $props();
  const convex = useConvexClient();

  let selectedOption = $state<ContactOption | null>(null);
  let message = $state("");
  let textareaRef = $state<HTMLTextAreaElement | null>(null);
  let isSending = $state(false);
  let submitError = $state("");
  let submitSuccess = $state(false);
  let localCooldownVersion = $state(0);

  let trimmedMessage = $derived(message.trim());
  let messageTooLong = $derived(message.length > MAX_MESSAGE_LENGTH);
  let localCooldownUntil = $derived.by(() => {
    localCooldownVersion;

    if (!open || !browser) {
      return null;
    }

    const cooldownUntil = readListingCooldowns()[listing._id] ?? null;
    return cooldownUntil && cooldownUntil > Date.now() ? cooldownUntil : null;
  });
  let isLocallyBlocked = $derived(
    localCooldownUntil !== null && localCooldownUntil > Date.now(),
  );
  let canSubmit = $derived(
    trimmedMessage.length > 0 &&
      !messageTooLong &&
      !isSending &&
      !submitSuccess &&
      !isLocallyBlocked,
  );

  const contactOptions: {
    id: ContactOption;
    label: string;
    Icon: typeof MessageCircleIcon;
  }[] = [
    { id: "whatsapp", label: "WhatsApp", Icon: MessageCircleIcon },
    { id: "email", label: "Email", Icon: MailIcon },
    { id: "phone", label: "Teléfono", Icon: PhoneIcon },
  ];

  function getAnonymousClientId() {
    if (!browser) {
      return null;
    }

    const existingId = localStorage.getItem(ANONYMOUS_CLIENT_ID_KEY);

    if (existingId) {
      return existingId;
    }

    const anonymousClientId =
      crypto.randomUUID?.() ??
      `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(ANONYMOUS_CLIENT_ID_KEY, anonymousClientId);
    return anonymousClientId;
  }

  function readListingCooldowns() {
    if (!browser) {
      return {} as Record<string, number>;
    }

    try {
      const rawCooldowns = localStorage.getItem(LISTING_COOLDOWNS_KEY);
      return rawCooldowns
        ? (JSON.parse(rawCooldowns) as Record<string, number>)
        : {};
    } catch {
      return {} as Record<string, number>;
    }
  }

  function storeListingCooldown() {
    if (!browser) {
      return;
    }

    const cooldownUntil = Date.now() + LISTING_INQUIRY_COOLDOWN_MS;
    const cooldowns = readListingCooldowns();
    cooldowns[listing._id] = cooldownUntil;
    localStorage.setItem(LISTING_COOLDOWNS_KEY, JSON.stringify(cooldowns));
    localCooldownVersion += 1;
  }

  function resetModalState() {
    selectedOption = null;
    message = "";
    submitError = "";
    submitSuccess = false;
    isSending = false;
  }

  function close() {
    if (isSending) {
      return;
    }

    open = false;
    setTimeout(() => {
      resetModalState();
    }, 300);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      close();
    }
  }

  function selectOption(option: { id: ContactOption; label: string }) {
    selectedOption = option.id;
    const stickerLabel = listing.sticker.label;
    const stickerCode = listing.sticker.code
      ? ` - ${listing.sticker.code}`
      : "";
    const prefill = `Hola ${listing.seller.displayName}, quiero comprar tu cromo ${stickerLabel}${stickerCode}. Por favor contáctame vía ${option.label} a: `;
    message = prefill;

    const len = prefill.length;
    setTimeout(() => {
      textareaRef?.focus();
      textareaRef?.setSelectionRange(len, len);
    }, 0);
  }

  async function sendMessage() {
    submitError = "";

    if (messageTooLong) {
      submitError = "Máximo 500 caracteres permitidos.";
      return;
    }

    if (!trimmedMessage) {
      return;
    }

    if (isLocallyBlocked) {
      submitError =
        "Ya enviaste un mensaje para este cromo recientemente. Intenta de nuevo mas tarde.";
      return;
    }

    const anonymousClientId = getAnonymousClientId();

    if (!anonymousClientId) {
      submitError = "No pudimos preparar el envio. Recarga la pagina.";
      return;
    }

    isSending = true;

    try {
      await convex.action(api.purchaseInquiries.sendPurchaseInquiry, {
        listingId: listing._id,
        anonymousClientId,
        message: trimmedMessage,
      });

      storeListingCooldown();
      submitSuccess = true;
    } catch (error) {
      submitError =
        error instanceof Error
          ? error.message
          : "No pudimos enviar tu mensaje. Intenta de nuevo.";
    } finally {
      isSending = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    transition:fade={{ duration: 180 }}
    onclick={() => !isSending && close()}
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
              {listing.sticker.label}
            </h2>
            <p class="text-sm text-muted-foreground">
              Envía tus datos al vendedor para coordinar la compra.
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
                disabled={isSending || submitSuccess}
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
          class="min-h-[88px] text-sm leading-relaxed"
          disabled={isSending || submitSuccess}
          placeholder="Escribe un mensaje o selecciona cómo contactarte…"
        />

        {#if messageTooLong}
          <p class="text-xs text-destructive">
            Máximo 500 caracteres permitidos.
          </p>
        {/if}

        {#if isLocallyBlocked && !submitSuccess}
          <p class="text-xs text-muted-foreground">
            Ya enviaste un mensaje para este cromo recientemente. Intenta de
            nuevo más tarde.
          </p>
        {/if}

        {#if submitError}
          <p class="text-xs text-destructive">{submitError}</p>
        {/if}

        {#if submitSuccess}
          <p class="text-xs text-emerald-600 dark:text-emerald-400">
            Mensaje enviado. El vendedor recibirá tu contacto por email.
          </p>
        {/if}

        <div
          class="flex items-start gap-2 rounded-2xl text-xs leading-relaxed text-muted-foreground"
        >
          <ShieldIcon class="mt-0.5 size-3.5 shrink-0 text-foreground/70" />
          <p class="text-pretty">
            Asegúrate de coordinar la transacción en un lugar público.
          </p>
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
            disabled={!canSubmit}
            class="duration-150 hover:bg-primary hover:brightness-105 active:scale-[0.96]"
            onclick={sendMessage}
          >
            {#if isSending}
              Enviando...
            {:else if submitSuccess}
              Mensaje enviado
            {:else}
              Enviar mensaje
            {/if}
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}
