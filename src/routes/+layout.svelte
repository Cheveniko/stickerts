<script lang="ts">
  import "./layout.css";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";
  import { setupConvexAuth } from "$lib/hooks/useAuth.svelte";
  import { setupCurrentUser } from "$lib/hooks/useCurrentUser.svelte";
  import favicon from "$lib/assets/favicon.svg";
  import { ModeWatcher } from "mode-watcher";
  import Navbar from "$lib/components/navbar.svelte";
  import Footer from "$lib/components/footer.svelte";

  let { children, data } = $props();

  setupConvexAuth({
    convexUrl: PUBLIC_CONVEX_URL,
    getServerState: () => data.authState,
  });

  setupCurrentUser();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher defaultMode="system" />
<div class="flex min-h-dvh flex-col">
  <Navbar />
  <main class="flex-1">
    {@render children()}
  </main>
  <Footer />
</div>
