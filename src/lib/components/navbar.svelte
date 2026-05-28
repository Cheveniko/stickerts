<script lang="ts">
  import { Search } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";
  import LoginModal from "$lib/components/login-modal.svelte";
  import AccountSettingsModal from "$lib/components/account-settings-modal.svelte";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { useCurrentUser } from "$lib/hooks/useCurrentUser.svelte";
  import * as m from "$lib/paraglide/messages";
  import { cn, getInitial } from "$lib/utils";

  let loginOpen = $state(false);
  let settingsOpen = $state(false);

  const currentUser = $derived.by(useCurrentUser());
</script>

<header
  class={cn(
    "fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background pr-2 pl-4 backdrop-blur-sm md:top-8 md:right-auto md:left-1/2 md:w-[700px] md:-translate-x-1/2 md:rounded-full md:border lg:w-[1000px]",
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
    <!-- <LanguageSwitcher /> -->
    {#if currentUser.status === "authenticated"}
      <button
        onclick={() => (settingsOpen = true)}
        class="flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-1.5 text-sm font-medium transition-[background-color,transform] duration-150 hover:bg-muted active:scale-[0.96]"
      >
        <Avatar.Root size="sm" class="after:border-0">
          <Avatar.Fallback>
            {getInitial(currentUser.user.name)}
          </Avatar.Fallback>
        </Avatar.Root>
        Ajustes
      </button>
    {:else if currentUser.status === "anonymous"}
      <Button onclick={() => (loginOpen = true)}>
        {m.nav_sell()}
      </Button>
    {:else}
      <div class="w-[98px]" aria-hidden="true"></div>
    {/if}
  </div>
</header>

<LoginModal bind:open={loginOpen} />
{#if currentUser.status === "authenticated"}
  <AccountSettingsModal
    user={currentUser.user}
    seller={currentUser.seller}
    bind:open={settingsOpen}
  />
{/if}
