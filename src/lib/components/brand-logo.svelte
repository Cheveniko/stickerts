<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import { cn } from "$lib/utils";
  import logoDark from "$lib/assets/stickerts-logo-dark.svg";
  import logoLight from "$lib/assets/stickerts-logo-light.svg";

  interface Props {
    class?: ClassValue;
    label?: string;
  }

  let { class: className, label = "Stickerts" }: Props = $props();
</script>

<span class="sr-only">{label}</span>
<img
  src={logoDark}
  alt="Stickerts"
  aria-hidden="true"
  class={cn("block w-auto dark:hidden", className)}
/>
<img
  src={logoLight}
  alt="Stickerts"
  aria-hidden="true"
  class={cn("hidden w-auto dark:block", className)}
/>
