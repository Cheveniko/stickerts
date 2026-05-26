<script lang="ts">
  import { page } from "$app/state";
  import { useAuth } from "$lib/hooks/useAuth.svelte";
  import { fade, fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import MailIcon from "@lucide/svelte/icons/mail";
  import XIcon from "@lucide/svelte/icons/x";

  type View = "form" | "success";

  type Props = {
    open: boolean;
  };

  let { open = $bindable() }: Props = $props();

  const auth = useAuth();

  let email = $state("");
  let view = $state<View>("form");
  let errorMessage = $state<string | null>(null);
  let submitting = $state(false);

  function close() {
    if (submitting) {
      return;
    }

    open = false;
    setTimeout(() => {
      email = "";
      view = "form";
      errorMessage = null;
    }, 300);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      close();
    }
  }

  function handleEmailInput() {
    if (errorMessage) {
      errorMessage = null;
    }
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail || submitting) {
      return;
    }

    submitting = true;
    errorMessage = null;

    try {
      await auth.signIn("resend", {
        email: normalizedEmail,
        redirectTo: `${page.url.pathname}${page.url.search}`,
      });

      email = normalizedEmail;
      view = "success";
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "No pudimos enviarte el enlace. Intenta de nuevo.";
    } finally {
      submitting = false;
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
      aria-labelledby="login-modal-title"
      tabindex="-1"
      class="pointer-events-auto w-full max-w-md rounded-4xl bg-popover shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="flex flex-col gap-5 p-6">
        {#if view === "form"}
          <!-- Header row -->
          <div class="flex items-start justify-between gap-4">
            <div class="flex min-w-0 flex-col gap-0.5">
              <h2 id="login-modal-title" class="font-semibold text-balance">
                Regístrate para empezar a vender
              </h2>
              <p class="text-sm text-muted-foreground">
                Ingresa tu correo y recibirás un enlace para entrar.
              </p>
            </div>
            <button
              aria-label="Cerrar"
              class="flex size-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
              disabled={submitting}
              onclick={close}
            >
              <XIcon class="size-4" />
            </button>
          </div>

          <form class="flex flex-col gap-5" onsubmit={handleSubmit}>
            <!-- Form fields -->
            <div class="flex flex-col gap-1.5">
              <Label for="login-email">Correo electrónico</Label>
              <Input
                id="login-email"
                type="email"
                bind:value={email}
                disabled={submitting}
                placeholder="tu@correo.com"
                class="border border-border bg-card"
                oninput={handleEmailInput}
              />
            </div>

            {#if errorMessage}
              <p class="text-sm text-destructive">
                {errorMessage}
              </p>
            {/if}

            <!-- Actions -->
            <div class="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={submitting}
                class="border border-border duration-150 active:scale-[0.96]"
                onclick={close}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!email.trim() || submitting}
                class="duration-150 hover:bg-primary hover:brightness-105 active:scale-[0.96]"
              >
                {submitting ? "Enviando" : "Continuar"}
              </Button>
            </div>
          </form>
        {:else}
          <!-- Success state -->
          <div class="flex flex-col items-center gap-4 py-2 text-center">
            <div
              class="flex size-16 items-center justify-center rounded-full bg-muted"
            >
              <MailIcon class="size-8 text-muted-foreground" />
            </div>
            <div class="flex flex-col gap-1.5">
              <h2 id="login-modal-title" class="font-semibold">
                Revisa tu correo
              </h2>
              <p class="text-sm text-pretty text-muted-foreground">
                Te enviamos un enlace mágico a
                <span class="font-semibold text-foreground">{email}</span>. Haz
                clic en él para completar tu registro.
              </p>
            </div>
            <Button
              class="mt-1 w-full duration-150 hover:bg-primary hover:brightness-105 active:scale-[0.96]"
              onclick={close}
            >
              Cerrar
            </Button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
