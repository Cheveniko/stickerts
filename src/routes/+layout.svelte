<script lang="ts">
  import "./layout.css";
  import { page } from "$app/state";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";
  import { setupConvexAuth } from "$lib/hooks/useAuth.svelte";
  import {
    setupCurrentUser,
    useCurrentUser,
  } from "$lib/hooks/useCurrentUser.svelte";
  import { resolveSeoMetadata, SITE_NAME } from "$lib/seo";
  import { dev } from "$app/environment";
  import { injectAnalytics } from "@vercel/analytics/sveltekit";
  import favicon from "$lib/assets/favicon.svg";
  import { ModeWatcher } from "mode-watcher";
  import Navbar from "$lib/components/navbar.svelte";
  import Footer from "$lib/components/footer.svelte";
  import NewListingDrawer from "$lib/components/new-listing-drawer.svelte";
  import { Toaster } from "$lib/components/ui/sonner/index.js";

  let { children, data } = $props();
  injectAnalytics({ mode: dev ? "development" : "production" });

  setupConvexAuth({
    convexUrl: PUBLIC_CONVEX_URL,
    getServerState: () => data.authState,
  });

  setupCurrentUser();

  const currentUser = $derived.by(useCurrentUser());
  const seo = $derived(resolveSeoMetadata(page.data.seo));
</script>

<svelte:head>
  <title>{seo.title}</title>
  <meta name="description" content={seo.description} />
  <meta name="robots" content={seo.robots} />
  <link rel="canonical" href={seo.canonicalUrl} />
  <link rel="icon" href={favicon} />

  <meta property="og:site_name" content={SITE_NAME} />
  <meta property="og:title" content={seo.title} />
  <meta property="og:description" content={seo.description} />
  <meta property="og:type" content={seo.ogType} />
  <meta property="og:url" content={seo.canonicalUrl} />
  <meta property="og:image" content={seo.imageUrl} />
  <meta property="og:image:alt" content={seo.imageAlt} />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={seo.title} />
  <meta name="twitter:description" content={seo.description} />
  <meta name="twitter:image" content={seo.imageUrl} />
</svelte:head>
<ModeWatcher defaultMode="system" />
<div class="flex min-h-dvh flex-col">
  <Navbar />
  <main class="flex-1">
    <Toaster />
    {@render children()}
  </main>
  <Footer />
  {#if currentUser.status === "authenticated" && currentUser.seller}
    <NewListingDrawer seller={currentUser.seller} />
  {/if}
</div>
