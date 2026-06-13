<div class="grid grid-cols-1 gap-2 md:grid-cols-4">
  {#each { length: 8 } as _, i (i)}
    <div
      class="flex animate-pulse items-stretch overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/5"
    >
      <div class="w-16 flex-shrink-0 bg-muted"></div>
      <div class="flex flex-1 flex-col justify-between py-3 pr-3 pl-3">
        <div class="space-y-1.5">
          <div class="h-3 w-full rounded-full bg-muted"></div>
          <div class="h-3 w-3/4 rounded-full bg-muted"></div>
        </div>
        <div class="space-y-1.5">
          <div class="h-2.5 w-2/3 rounded-full bg-muted"></div>
          <div class="h-3 w-1/2 rounded-full bg-muted"></div>
        </div>
      </div>
    </div>
  {/each}
</div>
