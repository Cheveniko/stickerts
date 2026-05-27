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
  <div class="flex h-14 items-center justify-between px-4 md:px-8">
    <!-- Left: Brand -->
    <span class="shrink-0 text-sm font-bold">Stickerts</span>

    <!-- Center: Legal links -->
    <div class="flex items-center gap-2 text-xs text-muted-foreground">
      <a href="/terms" class="transition-colors hover:text-foreground"
        >{m.footer_terms()}</a
      >
      <span aria-hidden="true">·</span>
      <a href="/privacy" class="transition-colors hover:text-foreground"
        >{m.footer_privacy()}</a
      >
    </div>

    <!-- Right: Theme toggle + attribution -->
    <div class="flex items-center gap-3">
      <button
        onclick={cycleMode}
        aria-label={modeLabel}
        title={modeLabel}
        class="text-muted-foreground transition-colors hover:text-foreground"
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
        href="https://codeline.ai"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >Codeline.ai</a
      >
    </div>
  </div>
</footer>
