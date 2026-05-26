<script lang="ts">
  import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
</script>

<div
  class="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center"
>
  <div class="flex size-16 items-center justify-center rounded-full bg-muted">
    <LayoutGridIcon class="size-8 text-muted-foreground" />
  </div>
  <div class="flex flex-col gap-1.5">
    <p class="font-semibold">Tus stickers</p>
    <p class="max-w-[240px] text-sm text-pretty text-muted-foreground">
      Aquí verás los stickers que ofreces cuando actives tu cuenta de vendedor.
    </p>
  </div>
</div>
