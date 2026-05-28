<script lang="ts">
  import TicketIcon from "@lucide/svelte/icons/ticket";
  import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
  import CollectorPassModal from "./collector-pass-modal.svelte";

  type Props = { onsuccess?: () => void };
  let { onsuccess }: Props = $props();

  let open = $state(false);
</script>

<div class="flex flex-col gap-3">
  <div class="flex flex-col gap-0.5">
    <p class="text-sm font-medium">Perfil de vendedor</p>
    <p class="text-sm text-pretty text-muted-foreground">
      Activa tu Pase de Coleccionista para publicar stickers, contactarte con
      dueños de cromos y recibir mensajes directos.
    </p>
  </div>
  <button
    class="flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
    onclick={() => (open = true)}
  >
    <div class="flex items-center gap-3">
      <div
        class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary dark:bg-primary/10"
      >
        <TicketIcon
          class="size-4 text-primary-foreground/80 dark:text-primary"
          style="transform: rotate(-45deg)"
        />
      </div>
      <div class="flex flex-col gap-0.5">
        <span class="text-sm font-medium">Pase de Coleccionista</span>
        <span class="text-xs text-muted-foreground">
          $1.99 USD · Acceso todo el 2026
        </span>
      </div>
    </div>
    <ChevronRightIcon class="size-4 shrink-0 text-muted-foreground" />
  </button>
</div>

<CollectorPassModal bind:open {onsuccess} />
