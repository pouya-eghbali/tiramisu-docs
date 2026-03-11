<script lang="ts">
  let { children }: { children?: import("svelte").Snippet } = $props()
</script>

<div class="file-tree my-4 rounded-lg border bg-card p-4 font-mono text-sm">
  {@render children?.()}
</div>

<style>
  .file-tree :global(.tree-file),
  .file-tree :global(.tree-folder-name) {
    position: relative;
    display: block;
    padding-left: 1.25rem;
    padding-top: 0.125rem;
    padding-bottom: 0.125rem;
  }

  .file-tree :global(.tree-file)::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.35rem;
    width: 14px;
    height: 14px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'/%3E%3Cpath d='M14 2v4a2 2 0 0 0 2 2h4'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
  }

  .file-tree :global(.tree-folder-name)::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.35rem;
    width: 14px;
    height: 14px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'/%3E%3C/svg%3E");
    background-size: contain;
    background-repeat: no-repeat;
  }

  .file-tree :global(.tree-folder-name) {
    font-weight: 500;
    color: var(--foreground);
  }

  /* Nesting: border aligned under parent folder icon center (7px ≈ 0.45rem) */
  .file-tree :global(.tree-folder > .tree-file),
  .file-tree :global(.tree-folder > .tree-folder) {
    margin-left: 0.45rem;
    border-left: 1px solid var(--border);
  }

  /* Nested files: shift icon away from border, increase padding to match */
  .file-tree :global(.tree-folder > .tree-file) {
    padding-left: 1.75rem;
  }
  .file-tree :global(.tree-folder > .tree-file)::before {
    left: 0.5rem;
  }

  /* Nested folders: gap from border to folder-name content */
  .file-tree :global(.tree-folder > .tree-folder) {
    padding-left: 0.5rem;
  }
</style>
