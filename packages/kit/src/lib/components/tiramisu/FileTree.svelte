<script lang="ts">
  let { children }: { children?: import("svelte").Snippet } = $props()
</script>

<div class="file-tree my-4 rounded-lg border bg-card p-4 font-mono text-sm">
  {@render children?.()}
</div>
