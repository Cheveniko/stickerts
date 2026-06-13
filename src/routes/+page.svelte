<script lang="ts">
  import * as m from "$lib/paraglide/messages";
  import Faq from "$lib/components/faq.svelte";
  import ListingsGrid from "$lib/components/listings-grid.svelte";
  import SalesGrid from "$lib/components/sales-grid.svelte";
</script>

<main class="container space-y-6 pt-20 pb-16 md:pt-30">
  <!-- <h2 class="text-xl font-semibold">{m.home_heading()}</h2> -->
  <ListingsGrid />
  <SalesGrid />
  <Faq />
</main>
