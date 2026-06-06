<script lang="ts">
  import { api } from "$convex/_generated/api";
  import type { ListingWithRelations } from "$convex/listings";
  import { getConvexErrorMessage } from "$lib/convex-errors";
  import { closeOnEscapeHandler } from "$lib/utils";
  import { useConvexClient } from "convex-svelte";
  import { fade, fly } from "svelte/transition";
  import { cubicIn, cubicOut } from "svelte/easing";
  import { toast } from "svelte-sonner";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
  import MailIcon from "@lucide/svelte/icons/mail";
  import ShieldIcon from "@lucide/svelte/icons/shield";
  import GiftIcon from "@lucide/svelte/icons/gift";
  import XIcon from "@lucide/svelte/icons/x";
  import * as m from "$lib/paraglide/messages";
  import { getLocale } from "$lib/paraglide/runtime";

  type Props = {
    listing: ListingWithRelations;
    open: boolean;
    freeContactsRemaining?: number | null;
    buyerEmail?: string | null;
  };

  type ContactOption = "whatsapp" | "email";

  const PHONE_MIN_LENGTH = 6;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let {
    listing,
    open = $bindable(),
    freeContactsRemaining = null,
    buyerEmail = null,
  }: Props = $props();
  const convex = useConvexClient();

  let selectedOption = $state<ContactOption | null>("whatsapp");
  let contactValue = $state("");
  let contactBlurred = $state(false);
  let inputRef = $state<HTMLInputElement | null>(null);
  let isSending = $state(false);
  let submitError = $state("");

  const modalSubtitle = $derived(
    listing.intent === "sale"
      ? m.purchase_subtitle_sale()
      : listing.intent === "trade"
        ? m.purchase_subtitle_trade()
        : m.purchase_subtitle_both(),
  );

  let trimmedContactValue = $derived(contactValue.trim());
  let isEmailValid = $derived(
    selectedOption === "email" && EMAIL_REGEX.test(trimmedContactValue),
  );
  let normalizedPhoneValue = $derived(
    trimmedContactValue.replace(/[^0-9]/g, ""),
  );
  let isPhoneValid = $derived(
    selectedOption === "whatsapp" &&
      trimmedContactValue === normalizedPhoneValue &&
      normalizedPhoneValue.length >= PHONE_MIN_LENGTH,
  );
  let contactValueError = $derived.by(() => {
    if (!selectedOption || trimmedContactValue.length === 0) {
      return "";
    }

    if (selectedOption === "email" && !isEmailValid) {
      return m.purchase_email_invalid();
    }

    if (selectedOption === "whatsapp" && !isPhoneValid) {
      return m.purchase_phone_invalid();
    }

    return "";
  });
  let canSubmit = $derived(
    selectedOption !== null &&
      trimmedContactValue.length > 0 &&
      !contactValueError &&
      !isSending,
  );
  let showContactError = $derived(contactBlurred && !!contactValueError);
  let contactLabel = $derived(
    selectedOption === "email"
      ? m.purchase_email_label()
      : m.purchase_phone_label(),
  );
  let contactPlaceholder = $derived(
    selectedOption === "email"
      ? m.purchase_email_placeholder()
      : m.purchase_phone_placeholder(),
  );

  const closeOnEscape = closeOnEscapeHandler(() => open, close);

  const contactOptions: {
    id: ContactOption;
    label: string;
    Icon: typeof MessageCircleIcon;
  }[] = [
    { id: "whatsapp", label: m.common_whatsapp(), Icon: MessageCircleIcon },
    { id: "email", label: m.common_email(), Icon: MailIcon },
  ];

  function resetModalState() {
    selectedOption = "whatsapp";
    contactValue = "";
    contactBlurred = false;
    submitError = "";
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

  function selectOption(option: { id: ContactOption; label: string }) {
    selectedOption = option.id;
    contactValue = option.id === "email" ? (buyerEmail ?? "") : "";
    contactBlurred = false;
    submitError = "";

    setTimeout(() => {
      inputRef?.focus();
      const len = contactValue.length;
      inputRef?.setSelectionRange(len, len);
    }, 0);
  }

  function handleContactInput(event: Event) {
    submitError = "";

    if (selectedOption !== "whatsapp") {
      return;
    }

    const target = event.currentTarget;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const numericValue = target.value.replace(/\D/g, "");
    if (numericValue !== contactValue) {
      contactValue = numericValue;
    }
  }

  function handleContactBlur() {
    contactBlurred = true;
  }

  async function sendMessage() {
    submitError = "";

    if (
      !selectedOption ||
      !trimmedContactValue ||
      contactValueError ||
      isSending
    ) {
      contactBlurred = true;
      return;
    }

    isSending = true;

    try {
      await convex.action(api.contacts.sendSellerContact, {
        listingId: listing._id,
        contactMethod: selectedOption,
        contactValue: trimmedContactValue,
        locale: getLocale(),
      });

      isSending = false;
      toast.success(m.purchase_message_sent());
      close();
    } catch (error) {
      submitError = getConvexErrorMessage(error);
    } finally {
      isSending = false;
    }
  }
</script>

<svelte:window onkeydown={closeOnEscape} />

{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    in:fade={{ duration: 180 }}
    out:fade={{ duration: 150 }}
    onclick={() => !isSending && close()}
  ></div>
{/if}

{#if open}
  <div
    class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
    in:fly={{ y: 14, duration: 280, easing: cubicOut }}
    out:fly={{ y: 14, duration: 200, easing: cubicIn }}
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
            aria-label={m.common_close()}
            class="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
            disabled={isSending}
            onclick={close}
          >
            <XIcon class="size-4" />
          </button>
        </div>

        <!-- Pills section -->
        <div class="flex flex-col gap-2">
          <p class="text-xs font-medium text-muted-foreground">
            {m.purchase_contact_prompt()}
          </p>
          <div class="flex flex-wrap gap-1.5">
            {#each contactOptions as option (option.id)}
              <button
                disabled={isSending}
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

        {#if selectedOption}
          <div class="flex flex-col gap-1.5">
            <Label for="purchase-contact-value">{contactLabel}</Label>
            <Input
              id="purchase-contact-value"
              bind:ref={inputRef}
              bind:value={contactValue}
              type={selectedOption === "email" ? "email" : "tel"}
              inputmode={selectedOption === "email" ? "email" : "numeric"}
              autocomplete={selectedOption === "email" ? "email" : "tel"}
              class="leading-relaxed"
              disabled={isSending}
              placeholder={contactPlaceholder}
              oninput={handleContactInput}
              onblur={handleContactBlur}
            />
            {#if showContactError}
              <p class="text-xs text-destructive">
                {contactValueError}
              </p>
            {:else}
              <p class="text-xs text-muted-foreground">
                {selectedOption === "email"
                  ? m.purchase_email_help()
                  : m.purchase_phone_help()}
              </p>
            {/if}
          </div>
        {/if}

        {#if submitError}
          <p class="text-xs text-destructive">{submitError}</p>
        {/if}

        <div class="flex flex-col gap-1.5">
          <div
            class="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
          >
            <ShieldIcon class="mt-0.5 size-3.5 shrink-0 text-foreground/70" />
            <p class="text-pretty">
              {m.purchase_safety_notice()}
            </p>
          </div>

          {#if freeContactsRemaining !== null && freeContactsRemaining > 0}
            <div
              class="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
              transition:fade={{ duration: 150 }}
            >
              <GiftIcon class="mt-0.5 size-3.5 shrink-0 text-foreground/70" />
              <p class="text-pretty">
                {m.purchase_free_contact_notice()}
              </p>
            </div>
          {/if}
        </div>

        <div class="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            disabled={isSending}
            class="border border-border duration-150 active:scale-[0.96]"
            onclick={close}
          >
            {m.common_cancel()}
          </Button>
          <Button
            disabled={!canSubmit}
            class="duration-150 hover:bg-primary hover:brightness-105 active:scale-[0.96]"
            onclick={sendMessage}
          >
            {#if isSending}
              {m.login_sending()}
            {:else}
              {m.purchase_send_message()}
            {/if}
          </Button>
        </div>
      </div>
    </div>
  </div>
{/if}
