<script lang="ts">
  import Collapsible from "../ui/collapsible/collapsible.svelte"

  let { title = "Details", children }: { title?: string; children?: import("svelte").Snippet } =
    $props()
  let open = $state(false)
</script>

<Collapsible bind:open class="my-2 rounded-lg border px-4 py-3">
  {#snippet trigger()}
    <span class="text-sm font-medium">{title}</span>
  {/snippet}
  <div class="pt-2 text-sm text-muted-foreground">
    {@render children?.()}
  </div>
</Collapsible>
