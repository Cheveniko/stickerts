<script lang="ts">
  import { api } from "$convex/_generated/api";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { useConvexClient } from "convex-svelte";
  import { getConvexErrorMessage } from "$lib/convex-errors";
  import type { SellerListingForSettings } from "$convex/listings";

  type Props = {
    listing: SellerListingForSettings;
    open?: boolean;
  };

  let { listing, open = $bindable(false) }: Props = $props();

  const convex = useConvexClient();
  let isDeleting = $state(false);
  let deleteError = $state("");

  async function handleDelete() {
    if (isDeleting) return;
    isDeleting = true;
    deleteError = "";

    try {
      await convex.mutation(api.listings.removeCurrentSellerListing, {
        listingId: listing._id,
      });
      open = false;
    } catch (error) {
      deleteError = getConvexErrorMessage(error);
    } finally {
      isDeleting = false;
    }
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content showCloseButton={false} class="gap-4">
    <Dialog.Header>
      <Dialog.Title>¿Eliminar publicación?</Dialog.Title>
      <Dialog.Description>
        Se eliminará <strong class="font-medium text-foreground"
          >{listing.sticker.label}</strong
        > de tus publicaciones. Esta acción no se puede deshacer.
      </Dialog.Description>
    </Dialog.Header>

    {#if deleteError}
      <p class="text-sm text-destructive">{deleteError}</p>
    {/if}

    <Dialog.Footer class="gap-2">
      <Button
        variant="ghost"
        disabled={isDeleting}
        class="border border-border duration-150 active:scale-[0.96]"
        onclick={() => (open = false)}
      >
        Cancelar
      </Button>
      <Button
        variant="destructive"
        disabled={isDeleting}
        class="duration-150 active:scale-[0.96]"
        onclick={handleDelete}
      >
        {isDeleting ? "Eliminando" : "Eliminar"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
