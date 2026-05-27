<script lang="ts">
  import ImagePlusIcon from "@lucide/svelte/icons/image-plus";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";

  type Props = {
    file?: File | null;
    maxSizeMb?: number;
    accept?: string[];
    error?: string | null;
  };

  let {
    file = $bindable(null),
    maxSizeMb = 5,
    accept = ["image/jpeg", "image/png", "image/webp"],
    error = null,
  }: Props = $props();

  let preview = $state<string | null>(null);
  let isDragging = $state(false);
  let internalError = $state<string | null>(null);
  let inputRef = $state<HTMLInputElement | null>(null);

  let visibleError = $derived(error ?? internalError);

  $effect(() => {
    if (file === null) {
      preview = null;
      internalError = null;
    }
  });

  function validateFile(f: File): string | null {
    if (!accept.includes(f.type)) return "Solo JPG, PNG o WEBP";
    if (f.size > maxSizeMb * 1024 * 1024) return `Máx ${maxSizeMb}MB`;
    return null;
  }

  function handleFiles(fileList: FileList | File[]) {
    const f = fileList[0];
    if (!f) return;

    const validationError = validateFile(f);
    if (validationError) {
      internalError = validationError;
      file = null;
      return;
    }

    internalError = null;
    file = f;

    const reader = new FileReader();
    reader.onload = (e) => {
      preview = e.target?.result as string;
    };
    reader.readAsDataURL(f);
  }

  function clearFile(e: MouseEvent) {
    e.stopPropagation();
    file = null;
    preview = null;
    internalError = null;
    if (inputRef) inputRef.value = "";
  }

  function openFilePicker() {
    inputRef?.click();
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    if (
      e.currentTarget instanceof HTMLElement &&
      !e.currentTarget.contains(e.relatedTarget as Node)
    ) {
      isDragging = false;
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    const files = e.dataTransfer?.files;
    if (files?.length) handleFiles(files);
  }

  function onInputChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    if (input.files?.length) handleFiles(input.files);
  }
</script>

<div class="flex flex-col gap-1.5">
  <!-- Drop zone area -->
  <div
    role="button"
    tabindex="0"
    aria-label="Subir imagen"
    class="group relative aspect-4/3 w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-[border-color,background-color,transform] duration-150 select-none
			{preview
      ? 'border-transparent bg-transparent'
      : isDragging
        ? 'scale-[1.01] border-primary bg-primary/8'
        : 'border-border bg-muted/40'}"
    onclick={openFilePicker}
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openFilePicker();
      }
    }}
    ondragenter={onDragEnter}
    ondragleave={onDragLeave}
    ondragover={onDragOver}
    ondrop={onDrop}
  >
    {#if preview}
      <!-- Preview state -->
      <img
        src={preview}
        alt="Preview del sticker"
        class="h-full w-full object-cover"
      />

      <!-- Hover overlay with "Cambiar" button -->
      <div
        class="absolute inset-0 flex items-end justify-center pb-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      >
        <button
          onclick={clearFile}
          class="flex items-center gap-1.5 rounded-xl bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors duration-150 hover:bg-black/70 active:scale-[0.96]"
        >
          <RefreshCwIcon class="size-3" />
          Cambiar
        </button>
      </div>
    {:else}
      <!-- Empty / dragging state -->
      <div
        class="flex h-full flex-col items-center justify-center gap-2 px-4 text-center"
      >
        <div
          class="flex size-10 items-center justify-center rounded-xl transition-colors duration-150 {isDragging
            ? 'bg-primary/15'
            : 'bg-muted'}"
        >
          <ImagePlusIcon
            class="size-5 transition-colors duration-150 {isDragging
              ? 'text-primary'
              : 'text-muted-foreground'}"
          />
        </div>
        <div>
          <p class="text-sm font-medium text-foreground">
            Arrastra o haz clic para subir
          </p>
          <p class="mt-0.5 text-xs text-muted-foreground">
            JPG · PNG · WEBP · Máx {maxSizeMb}MB
          </p>
        </div>
      </div>
    {/if}
  </div>

  <!-- Error message -->
  {#if visibleError}
    <p class="text-sm text-destructive">{visibleError}</p>
  {/if}

  <!-- Hidden file input -->
  <input
    bind:this={inputRef}
    type="file"
    accept={accept.join(",")}
    onchange={onInputChange}
    class="hidden"
  />
</div>
