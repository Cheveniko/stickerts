<script lang="ts">
  import "./layout.css";
  import { PUBLIC_CONVEX_URL } from "$env/static/public";
  import { setupConvexAuth } from "$lib/auth";
  import favicon from "$lib/assets/favicon.svg";
  import Navbar from "$lib/components/navbar.svelte";

  let { children, data } = $props();

  setupConvexAuth({
    convexUrl: PUBLIC_CONVEX_URL,
    getServerState: () => data.authState,
  });
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Navbar />
{@render children()}
