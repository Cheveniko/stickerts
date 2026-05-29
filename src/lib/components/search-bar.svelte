<script lang="ts">
  import { Search } from "@lucide/svelte";
  import { useSearchParams } from "runed/kit";
  import { listingSearchParamsSchema } from "$lib/schemas";
  import * as m from "$lib/paraglide/messages";

  const params = useSearchParams(listingSearchParamsSchema, {
    noScroll: true,
    pushHistory: false,
  });
</script>

<div class="hidden flex-1 items-center gap-2 rounded-full px-3 py-1.5 md:flex">
  <Search class="size-4 shrink-0 text-muted-foreground" />
  <input
    type="search"
    placeholder={m.nav_search_placeholder()}
    bind:value={params.q}
    class="w-full rounded-full border-transparent bg-transparent text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:outline-none"
  />
</div>
