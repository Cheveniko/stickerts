<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import LoginModal from "$lib/components/login-modal.svelte";
  import AccountSettingsModal from "$lib/components/account-settings-modal.svelte";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { useCurrentUser } from "$lib/hooks/useCurrentUser.svelte";
  import * as m from "$lib/paraglide/messages";
  import { cn, getInitial } from "$lib/utils";
  import SearchBar from "$lib/components/search-bar.svelte";
  import MobileSearchBar from "$lib/components/mobile-search-bar.svelte";
  import { page } from "$app/state";

  let loginOpen = $state(false);
  let settingsOpen = $state(false);

  const currentUser = $derived.by(useCurrentUser());

  const isHomePage = $derived(page.url.pathname === "/");
</script>

<header
  class={cn(
    "fixed inset-x-0 top-0 z-50 border-b bg-background backdrop-blur-sm md:top-8 md:right-auto md:left-1/2 md:flex md:h-14 md:w-[700px] md:-translate-x-1/2 md:items-center md:justify-between md:gap-4 md:rounded-full md:border md:pr-2 md:pl-4 lg:w-[1000px]",
  )}
>
  <div
    class="container flex h-14 items-center justify-between gap-4 md:contents"
  >
    <a href="/" class="shrink-0 text-lg font-bold">Stickerts</a>

    {#if isHomePage}
      <SearchBar />
    {/if}

    <div class="flex shrink-0 items-center gap-2 md:gap-3">
      {#if isHomePage}
        <MobileSearchBar />
      {/if}
      <!-- Algun día XD -->
      <!-- <span class="hidden text-sm text-muted-foreground md:block"> -->
      <!--   {m.nav_how_it_works()} -->
      <!-- </span> -->
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
