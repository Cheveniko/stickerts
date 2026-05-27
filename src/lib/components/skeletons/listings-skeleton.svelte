<div
  class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5"
>
  {#each { length: 10 } as _, i (i)}
    <div
      class="animate-pulse overflow-hidden rounded-4xl bg-card shadow-md ring-1 ring-foreground/5"
    >
      <div class="aspect-[3/4] bg-muted"></div>
      <div class="p-3">
        <div class="h-3.5 w-3/4 rounded-full bg-muted"></div>
        <div class="mt-1.5 h-3 w-2/5 rounded-full bg-muted"></div>
        <div class="mt-3 flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <div class="size-5 rounded-full bg-muted"></div>
            <div class="h-3 w-16 rounded-full bg-muted"></div>
          </div>
          <div class="h-7 w-20 rounded-xl bg-muted"></div>
        </div>
      </div>
    </div>
  {/each}
</div>
