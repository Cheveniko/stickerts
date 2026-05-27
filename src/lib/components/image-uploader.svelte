<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    LISTING_IMAGE_ACCEPTED_TYPES,
    processListingImage,
    type ListingImageContentType,
  } from "$lib/image-processing";
  import ImagePlusIcon from "@lucide/svelte/icons/image-plus";
  import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
  import { cn } from "$lib/utils";

  type Props = {
    file?: File | null;
    maxSizeMb?: number;
    error?: string | null;
  };

  const inputId = "image-uploader-input";

  let { file = $bindable(null), maxSizeMb = 5, error = null }: Props = $props();

  let preview = $state<string | null>(null);
  let isDragging = $state(false);
  let isProcessing = $state(false);
  let internalError = $state<string | null>(null);
  let inputKey = $state(0);

  let visiblePreview = $derived(file === null ? null : preview);
  let visibleError = $derived(error ?? internalError);

  function revokePreviewUrl(url: string | null) {
    if (url) URL.revokeObjectURL(url);
  }

  onDestroy(() => {
    revokePreviewUrl(preview);
  });

  function validateFile(f: File): string | null {
    if (
      !LISTING_IMAGE_ACCEPTED_TYPES.includes(f.type as ListingImageContentType)
    ) {
      return "Solo JPG o PNG";
    }
    if (f.size > maxSizeMb * 1024 * 1024) return `Máx ${maxSizeMb}MB`;
    return null;
  }

  async function handleFiles(fileList: FileList | File[]) {
    if (isProcessing) return;

    const f = fileList[0];
    if (!f) return;

    const validationError = validateFile(f);
    if (validationError) {
      internalError = validationError;
      file = null;
      revokePreviewUrl(preview);
      preview = null;
      inputKey += 1;
      return;
    }

    isProcessing = true;

    try {
      const processedImage = await processListingImage(f);

      internalError = null;
      file = processedImage.file;
      revokePreviewUrl(preview);
      preview = processedImage.previewUrl;
    } catch (processingError) {
      internalError =
        processingError instanceof Error
          ? processingError.message
          : "No pudimos procesar la imagen seleccionada.";
      file = null;
      revokePreviewUrl(preview);
      preview = null;
    } finally {
      isProcessing = false;
      inputKey += 1;
    }
  }

  function clearFile(e: MouseEvent) {
    e.stopPropagation();
    if (isProcessing) return;

    file = null;
    revokePreviewUrl(preview);
    preview = null;
    internalError = null;
    inputKey += 1;
  }

  function openFilePicker() {
    if (isProcessing) return;
    document.getElementById(inputId)?.click();
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault();
    if (isProcessing) return;
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
    if (isProcessing) return;
    const files = e.dataTransfer?.files;
    if (files?.length) handleFiles(files);
  }

  function onInputChange(e: Event) {
    if (isProcessing) return;
    const input = e.currentTarget as HTMLInputElement;
    if (input.files?.length) handleFiles(input.files);
  }
</script>

<div class="flex w-full flex-col gap-1.5">
  <!-- Drop zone area -->
  <div
    role="button"
    tabindex="0"
    aria-label="Subir imagen"
    aria-disabled={isProcessing}
    class="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-dashed transition-[border-color,background-color,transform,opacity] duration-150 select-none
			{visiblePreview
      ? 'border-transparent bg-transparent'
      : isDragging
        ? 'scale-[1.01] border-primary bg-primary/8'
        : 'border-border bg-muted/40'}
			{isProcessing ? 'cursor-progress opacity-80' : 'cursor-pointer'}"
    onclick={openFilePicker}
    onkeydown={(e) => {
      if (isProcessing) return;
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
    {#if visiblePreview}
      <!-- Preview state -->
      <img
        src={visiblePreview}
        alt="Preview del sticker"
        class="mx-auto h-full object-cover"
      />

      <div
        class={cn(
          "absolute inset-0 flex items-end justify-center pb-3 transition-opacity duration-150",
          isProcessing
            ? "bg-black/35 opacity-100"
            : "opacity-0 group-hover:opacity-100",
        )}
      >
        {#if isProcessing}
          <p
            class="rounded-xl bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm"
          >
            Procesando imagen
          </p>
        {:else}
          <button
            onclick={clearFile}
            class="flex items-center gap-1.5 rounded-xl bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors duration-150 hover:bg-black/70 active:scale-[0.96]"
          >
            <RefreshCwIcon class="size-3" />
            Cambiar
          </button>
        {/if}
      </div>
    {:else}
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
            {isProcessing
              ? "Procesando imagen..."
              : "Arrastra o haz clic para subir"}
          </p>
          <p class="mt-0.5 text-xs text-muted-foreground">
            JPG · PNG · Máx {maxSizeMb}MB
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
  {#key inputKey}
    <input
      id={inputId}
      type="file"
      accept={LISTING_IMAGE_ACCEPTED_TYPES.join(",")}
      onchange={onInputChange}
      disabled={isProcessing}
      class="hidden"
    />
  {/key}
</div>
