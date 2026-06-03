<script lang="ts">
  import { api } from "$convex/_generated/api";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { useConvexClient } from "convex-svelte";
  import { getConvexErrorMessage } from "$lib/convex-errors";
  import type { SellerListingForSettings } from "$convex/listings";
  import * as m from "$lib/paraglide/messages";

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
      <Dialog.Title>{m.delete_listing_title()}</Dialog.Title>
      <Dialog.Description>
        {m.delete_listing_description_prefix()}
        <strong class="font-medium text-foreground"
          >{listing.sticker.label}</strong
        >
        {m.delete_listing_description_suffix()}
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
        {m.common_cancel()}
      </Button>
      <Button
        variant="destructive"
        disabled={isDeleting}
        class="duration-150 active:scale-[0.96]"
        onclick={handleDelete}
      >
        {isDeleting ? m.delete_listing_deleting() : m.delete_listing_confirm()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
