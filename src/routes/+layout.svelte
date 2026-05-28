<script lang="ts">
  import "./layout.css";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";
  import { setupConvexAuth } from "$lib/hooks/useAuth.svelte";
  import {
    setupCurrentUser,
    useCurrentUser,
  } from "$lib/hooks/useCurrentUser.svelte";
  import { dev } from "$app/environment";
  import { injectAnalytics } from "@vercel/analytics/sveltekit";
  import favicon from "$lib/assets/favicon.svg";
  import { ModeWatcher } from "mode-watcher";
  import Navbar from "$lib/components/navbar.svelte";
  import Footer from "$lib/components/footer.svelte";
  import NewListingDrawer from "$lib/components/new-listing-drawer.svelte";

  let { children, data } = $props();
  injectAnalytics({ mode: dev ? "development" : "production" });

  setupConvexAuth({
    convexUrl: PUBLIC_CONVEX_URL,
    getServerState: () => data.authState,
  });

  setupCurrentUser();

  const currentUser = $derived.by(useCurrentUser());
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher defaultMode="system" />
<div class="flex min-h-dvh flex-col">
  <Navbar />
  <main class="flex-1">
    {@render children()}
  </main>
  <Footer />
  {#if currentUser.status === "authenticated" && currentUser.seller}
    <NewListingDrawer seller={currentUser.seller} />
  {/if}
</div>
