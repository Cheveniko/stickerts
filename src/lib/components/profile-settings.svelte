<script lang="ts">
  import type { User } from "$convex/users";
  import * as Avatar from "$lib/components/ui/avatar/index.js";
  import { getInitial } from "$lib/utils";

  type Props = {
    user: User;
  };

  let { user }: Props = $props();
</script>

<div class="flex flex-col gap-6">
  <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
    <Avatar.Root class="size-16 shrink-0 text-lg">
      <Avatar.Fallback
        >{getInitial(user.name ?? user.email ?? "")}</Avatar.Fallback
      >
    </Avatar.Root>
    <div class="flex min-w-0 flex-col gap-0.5 text-center sm:text-left">
      <p class="truncate font-semibold">{user.name ?? "—"}</p>
      <p class="truncate text-sm text-muted-foreground">{user.email ?? "—"}</p>
    </div>
  </div>
  <p class="text-sm text-pretty text-muted-foreground">
    Tu perfil de vendedor se completa cuando actives tu cuenta de vendedor.
  </p>
</div>
