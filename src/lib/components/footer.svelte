<script lang="ts">
  import { Monitor, Moon, Sun } from "@lucide/svelte";
  import { setMode, userPrefersMode } from "mode-watcher";
  import * as m from "$lib/paraglide/messages";

  function cycleMode() {
    const current = userPrefersMode.current;
    if (current === "light") setMode("dark");
    else if (current === "dark") setMode("system");
    else setMode("light");
  }

  const modeLabel = $derived(
    userPrefersMode.current === "light"
      ? m.footer_theme_light()
      : userPrefersMode.current === "dark"
        ? m.footer_theme_dark()
        : m.footer_theme_system(),
  );
</script>

<footer class="border-t bg-background">
  <div
    class="container flex flex-wrap items-center gap-x-2 gap-y-2.5 py-3.5 sm:h-14 sm:flex-nowrap sm:justify-between sm:py-0"
  >
    <!-- Brand: always first, left -->
    <a href="/" class="order-1 shrink-0 text-sm font-bold">Stickerts</a>

    <!-- Legal links: wraps to second row on mobile (order-3 + w-full), center on desktop -->
    <div
      class="order-3 flex w-full items-center gap-1.5 text-xs text-muted-foreground sm:order-2 sm:w-auto"
    >
      <a href="/terms" class="-m-1 p-1 transition-colors hover:text-foreground">
        {m.footer_terms()}
      </a>
      <span aria-hidden="true">·</span>
      <a
        href="/privacy"
        class="-m-1 p-1 transition-colors hover:text-foreground"
      >
        {m.footer_privacy()}
      </a>
    </div>

    <!-- Theme toggle + attribution: pushed right on mobile (ml-auto), right on desktop -->
    <div class="order-2 ml-auto flex items-center gap-3 sm:order-3 sm:ml-0">
      <button
        onclick={cycleMode}
        aria-label={modeLabel}
        title={modeLabel}
        class="p-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        {#if userPrefersMode.current === "light"}
          <Sun class="size-4" />
        {:else if userPrefersMode.current === "dark"}
          <Moon class="size-4" />
        {:else}
          <Monitor class="size-4" />
        {/if}
      </button>

      <a
        href="https://x.com/Cheveniko"
        target="_blank"
        rel="noopener noreferrer"
        class="-m-1 p-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Codeline.ai
      </a>
    </div>
  </div>
</footer>
