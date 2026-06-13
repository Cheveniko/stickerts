<script lang="ts">
  import Faq from "$lib/components/faq.svelte";
  import ListingsGrid from "$lib/components/listings-grid.svelte";
  import SalesGrid from "$lib/components/sales-grid.svelte";
</script>

<main class="container space-y-6 pt-20 pb-16 md:pt-30">
  <ListingsGrid />
  <SalesGrid />
  <Faq />
</main>
