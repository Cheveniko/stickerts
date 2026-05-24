<script lang="ts">
  import { Search } from "@lucide/svelte";
  import LanguageSwitcher from "$lib/components/language-switcher.svelte";
  import { Button } from "$lib/components/ui/button";
  import * as m from "$lib/paraglide/messages";
  import { cn } from "$lib/utils";
</script>

<header
  class={cn(
    "fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-4 border bg-background pr-2 pl-4 backdrop-blur-sm md:top-8 md:right-auto md:left-1/2 md:w-[700px] md:-translate-x-1/2 md:rounded-full lg:w-[1000px]",
  )}
>
  <span class="shrink-0 text-lg font-bold">Stickerts</span>

  <div
    class="hidden flex-1 items-center gap-2 rounded-full px-3 py-1.5 md:flex"
  >
    <Search class="size-4 shrink-0 text-muted-foreground" />
    <input
      type="search"
      placeholder={m.nav_search_placeholder()}
      class="w-full rounded-full border-transparent bg-transparent text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
    />
  </div>

  <div class="flex shrink-0 items-center gap-2 md:gap-3">
    <span class="text-sm text-muted-foreground">{m.nav_how_it_works()}</span>
    <LanguageSwitcher />
    <Button>{m.nav_sell()}</Button>
  </div>
</header>
