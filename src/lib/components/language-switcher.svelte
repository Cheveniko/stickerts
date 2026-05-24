<script lang="ts">
  import { page } from "$app/state";
  import { Button } from "$lib/components/ui/button";
  import * as m from "$lib/paraglide/messages";
  import {
    deLocalizeHref,
    getLocale,
    localizeHref,
    locales,
    setLocale,
  } from "$lib/paraglide/runtime";

  type Locale = (typeof locales)[number];

  const currentPath = $derived(
    `${page.url.pathname}${page.url.search}${page.url.hash}`,
  );
  const basePath = $derived(deLocalizeHref(currentPath));

  function switchLocale(targetLocale: Locale) {
    setLocale(targetLocale, { reload: false });
  }

  function localizedHref(targetLocale: Locale) {
    return localizeHref(basePath, { locale: targetLocale });
  }
</script>

<div class="flex items-center gap-1 rounded-full border border-border/80 p-1">
  <span class="sr-only">{m.nav_language_label()}</span>

  {#each locales as locale (locale)}
    <Button
      href={localizedHref(locale)}
      variant={getLocale() === locale ? "secondary" : "ghost"}
      size="xs"
      class="h-7 min-w-8 rounded-full px-2 uppercase"
      aria-current={getLocale() === locale ? "page" : undefined}
      onclick={() => switchLocale(locale)}
      data-sveltekit-reload
    >
      {locale}
    </Button>
  {/each}
</div>
