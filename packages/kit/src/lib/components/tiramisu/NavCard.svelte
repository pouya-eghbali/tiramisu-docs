<script lang="ts">
  let {
    title = "",
    description = "",
    href = "#",
  }: { title?: string; description?: string; href?: string } = $props()
</script>

<a
  {href}
  class="group flex flex-col gap-2 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-accent"
>
  <span class="font-semibold text-card-foreground group-hover:text-primary">{title}</span>
  {#if description}
    <span class="text-sm text-muted-foreground">{description}</span>
  {/if}
</a>
