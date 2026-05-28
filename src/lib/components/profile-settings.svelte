<script lang="ts">
  import { api } from "$convex/_generated/api";
  import type { User } from "$convex/users";
  import type { CurrentSeller } from "$convex/sellers";
  import { getConvexErrorMessage } from "$lib/convex-errors";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { getInitial } from "$lib/utils";
  import { useConvexClient } from "convex-svelte";
  import PencilLineIcon from "@lucide/svelte/icons/pencil-line";
  import GiftIcon from "@lucide/svelte/icons/gift";
  import { fade } from "svelte/transition";

  type Props = {
    user: User;
    seller: CurrentSeller | null;
  };

  let { user, seller }: Props = $props();
  const convex = useConvexClient();

  let isEditingName = $state(false);
  let isSavingName = $state(false);
  let nameError = $state("");
  let nameValue = $state("");

  function startEditing() {
    nameValue = user.name;
    nameError = "";
    isEditingName = true;
  }

  async function saveName() {
    if (isSavingName) return;

    nameError = "";

    const normalizedName = nameValue.trim();
    if (normalizedName === user.name) {
      nameValue = user.name;
      isEditingName = false;
      return;
    }

    isSavingName = true;

    try {
      await convex.mutation(api.users.updateCurrentUserName, {
        name: nameValue,
      });
      isEditingName = false;
    } catch (error) {
      nameError = getConvexErrorMessage(error);
    } finally {
      isSavingName = false;
    }
  }

  function cancelName() {
    if (isSavingName) return;

    isEditingName = false;
    nameError = "";
    nameValue = user.name;
  }
</script>

<div class="flex flex-col gap-6">
  <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
    <Avatar.Root class="size-10 shrink-0 text-lg">
      <Avatar.Fallback>{getInitial(user.name)}</Avatar.Fallback>
    </Avatar.Root>
    <div class="flex min-w-0 flex-col gap-0.5 text-center sm:text-left">
      {#if isEditingName}
        <input
          bind:value={nameValue}
          disabled={isSavingName}
          onblur={saveName}
          onkeydown={(e) => {
            if (e.key === "Enter") saveName();
            if (e.key === "Escape") cancelName();
          }}
          class="-mx-1 w-full min-w-0 rounded-sm border-0 bg-transparent px-1 py-0.5 font-semibold ring-1 ring-ring outline-none text-center sm:text-left"
          {@attach (node) => node.focus()}
        />
      {:else}
        <button
          disabled={isSavingName}
          onclick={startEditing}
          class="-mx-1 flex w-full cursor-text items-center gap-1.5 rounded-sm px-1 py-0.5 justify-center sm:justify-start transition-colors hover:bg-accent/50"
        >
          <span class="block truncate font-semibold">{user.name}</span>
          <PencilLineIcon class="h-3 w-3 shrink-0 text-muted-foreground" />
        </button>
      {/if}

      {#if nameError}
        <p class="mt-1 text-sm text-destructive">{nameError}</p>
      {/if}

      <p class="truncate text-sm text-muted-foreground">{user.email}</p>

      {#if !seller}
        <div transition:fade={{ duration: 150 }}>
          {#if user.freeSellerContactsRemaining > 0}
            <span
              class="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-2.5 py-1 text-xs font-medium text-foreground"
            >
              <GiftIcon class="size-3 shrink-0" />
              Tienes 1 contacto con vendedores gratis.
            </span>
          {:else}
            <span
              class="mt-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              <GiftIcon class="size-3 shrink-0 opacity-60" />
              Usaste tu contacto con vendedores gratis.
            </span>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</div>
