<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { useAuth } from "$lib/hooks/useAuth.svelte";
  import ProfileSettings from "$lib/components/profile-settings.svelte";
  import StickersSettings from "$lib/components/stickers-settings.svelte";
  import { useCurrentUser } from "$lib/hooks/useCurrentUser.svelte";
  import UserIcon from "@lucide/svelte/icons/user";
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
  import LogOutIcon from "@lucide/svelte/icons/log-out";
  import XIcon from "@lucide/svelte/icons/x";

  type Props = { open: boolean };
  let { open = $bindable() }: Props = $props();

  let activeSection = $state<"profile" | "stickers">("profile");
  let signingOut = $state(false);

  const auth = useAuth();
  const getCurrentUser = useCurrentUser();

  let currentUser = $derived(getCurrentUser());

  function close() {
    open = false;
    setTimeout(() => {
      activeSection = "profile";
    }, 300);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) close();
  }

  async function handleSignOut() {
    signingOut = true;
    try {
      await auth.signOut();
      close();
    } finally {
      signingOut = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

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
        onclick={close}
      >
        <XIcon class="size-4" />
      </button>

      <!-- Two-column layout -->
      <div class="flex min-h-[460px]">
        <!-- LEFT RAIL -->
        <div class="flex w-40 shrink-0 flex-col border-r p-3 sm:w-44">
          <nav class="flex flex-1 flex-col gap-0.5">
            <!-- Profile button -->
            <button
              class={[
                "flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium transition-colors duration-150",
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
            <button
              class={[
                "flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium transition-colors duration-150",
                activeSection === "stickers"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              ].join(" ")}
              onclick={() => (activeSection = "stickers")}
            >
              <LayoutGridIcon class="size-4 shrink-0" />
              Stickers
            </button>
          </nav>

          <!-- Sign out area -->
          <div class="mt-auto border-t pt-2">
            <button
              disabled={signingOut}
              class="flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium text-destructive transition-colors duration-150 hover:bg-destructive/10 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50"
              onclick={handleSignOut}
            >
              <LogOutIcon class="size-4 shrink-0" />
              {signingOut ? "Saliendo" : "Cerrar sesión"}
            </button>
          </div>
        </div>

        <!-- RIGHT PANEL -->
        <div class="flex-1 overflow-y-auto p-6 pt-12">
          {#if activeSection === "profile"}
            {#if currentUser.status === "authenticated"}
              <ProfileSettings user={currentUser.user} />
            {:else if currentUser.status === "loading"}
              <div class="flex flex-1 items-center justify-center py-8 text-center">
                <p class="text-sm text-muted-foreground">Cargando perfil...</p>
              </div>
            {:else}
              <div class="flex flex-1 items-center justify-center py-8 text-center">
                <p class="text-sm text-muted-foreground">
                  No pudimos cargar tu perfil.
                </p>
              </div>
            {/if}
          {:else}
            <StickersSettings />
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
