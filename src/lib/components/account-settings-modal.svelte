<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { closeOnEscapeHandler, lockScroll } from "$lib/utils";
  import { useAuth } from "$lib/hooks/useAuth.svelte";
  import ProfileSettings from "$lib/components/profile-settings.svelte";
  import StickersSettings from "$lib/components/stickers-settings.svelte";
  import UserIcon from "@lucide/svelte/icons/user";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import LogOutIcon from "@lucide/svelte/icons/log-out";
  import XIcon from "@lucide/svelte/icons/x";
  import type { User } from "$convex/users";
  import type { CurrentSeller } from "$convex/sellers";
  import SellerSettings from "./seller-settings.svelte";
  import Separator from "./ui/separator/separator.svelte";
  import CollectorPassCallout from "./collector-pass-callout.svelte";
  import SellerSuccessModal from "./seller-success-modal.svelte";

  type Props = { user: User; seller: CurrentSeller | null; open: boolean };

  let { user, seller, open = $bindable() }: Props = $props();

  let activeSection = $state<"profile" | "stickers">("profile");
  let signingOut = $state(false);
  let signOutError = $state<string | null>(null);
  let sellerSuccessOpen = $state(false);

  const auth = useAuth();
  function close(force = false) {
    if (signingOut && !force) {
      return;
    }

    open = false;
    setTimeout(() => {
      activeSection = "profile";
      signOutError = null;
    }, 300);
  }

  function handleClose() {
    close();
  }

  const closeOnEscape = closeOnEscapeHandler(() => open, handleClose);

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    signingOut = true;
    signOutError = null;

    try {
      await auth.signOut();
      close(true);
    } catch (error) {
      signOutError =
        error instanceof Error
          ? error.message
          : "No pudimos cerrar tu sesion. Intenta de nuevo.";
    } finally {
      signingOut = false;
    }
  }
</script>

<svelte:window onkeydown={closeOnEscape} />

{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
    transition:fade={{ duration: 180 }}
    onclick={handleClose}
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
      aria-labelledby="account-settings-modal-title"
      tabindex="-1"
      class="pointer-events-auto relative w-full max-w-2xl overflow-hidden rounded-4xl bg-popover shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <!-- X Close button -->
      <button
        aria-label="Cerrar"
        class="absolute top-3.5 right-3.5 z-10 flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
        disabled={signingOut}
        onclick={handleClose}
      >
        <XIcon class="size-4" />
      </button>

      <!-- Responsive layout: stacked on mobile, two-column on desktop -->
      <div
        class="flex h-[480px] max-h-[calc(100dvh-2rem)] flex-col sm:h-[520px] sm:flex-row lg:h-[540px]"
      >
        <!-- RAIL: tab bar on mobile (top), sidebar on desktop (left) -->
        <div
          class="flex flex-row border-b p-2 pr-12 sm:w-44 sm:shrink-0 sm:flex-col sm:border-r sm:border-b-0 sm:p-3 sm:pr-3"
        >
          <nav class="flex flex-1 flex-row gap-1 sm:flex-col sm:gap-0.5">
            <!-- Profile button -->
            <button
              disabled={signingOut}
              class={[
                "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 sm:w-full sm:py-2",
                activeSection === "profile"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              ].join(" ")}
              onclick={() => (activeSection = "profile")}
            >
              <UserIcon class="size-4 shrink-0" />
              Perfil
            </button>

            <!-- Stickers button -->
            {#if seller}
              <button
                disabled={signingOut}
                class={[
                  "flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 sm:w-full sm:py-2",
                  activeSection === "stickers"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                ].join(" ")}
                onclick={() => (activeSection = "stickers")}
              >
                <LayoutGridIcon class="size-4 shrink-0" />
                Cromos
              </button>
            {/if}
          </nav>

          <!-- Sign out: desktop sidebar only -->
          <div class="mt-auto hidden border-t pt-2 sm:block">
            <button
              disabled={signingOut}
              class="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium text-destructive transition-colors duration-150 hover:bg-destructive/10 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50"
              onclick={handleSignOut}
            >
              <LogOutIcon class="size-4 shrink-0" />
              {signingOut ? "Saliendo" : "Cerrar sesión"}
            </button>
            {#if signOutError}
              <p role="alert" class="mt-2 px-3 text-sm text-destructive">
                {signOutError}
              </p>
            {/if}
          </div>
        </div>

        <!-- CONTENT PANEL -->
        <div class="flex-1 overflow-y-auto p-4 pt-5 sm:p-6 sm:pt-8">
          {#if activeSection === "profile"}
            <div class="">
              <ProfileSettings {user} />
              <Separator class="my-4" />
              {#if seller}
                <SellerSettings {seller} />
              {:else}
                <CollectorPassCallout onsuccess={() => (sellerSuccessOpen = true)} />
              {/if}
            </div>
          {:else}
            <StickersSettings />
          {/if}
        </div>

        <!-- Sign out footer: mobile only -->
        <div class="border-t p-2 sm:hidden">
          <button
            disabled={signingOut}
            class="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium text-destructive transition-colors duration-150 hover:bg-destructive/10 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50"
            onclick={handleSignOut}
          >
            <LogOutIcon class="size-4 shrink-0" />
            {signingOut ? "Saliendo" : "Cerrar sesión"}
          </button>
          {#if signOutError}
            <p role="alert" class="mt-2 px-3 text-sm text-destructive">
              {signOutError}
            </p>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<SellerSuccessModal bind:open={sellerSuccessOpen} />
