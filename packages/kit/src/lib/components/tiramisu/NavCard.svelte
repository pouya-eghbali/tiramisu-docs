<script lang="ts">
  let {
    title = "",
    description = "",
    href = "",
    icon = "",
    image = "",
  }: {
    title?: string
    description?: string
    href?: string
    icon?: string
    image?: string
  } = $props()
</script>

{#snippet cardContent()}
  {#if image}
    <div class="aspect-[2/1] w-full overflow-hidden bg-muted">
      <img src={image} alt="" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
    </div>
  {/if}
  <div class="flex flex-col gap-2 p-5">
    <span class="flex items-center gap-2 font-semibold text-card-foreground group-hover:text-primary">
      {#if icon}
        <iconify-icon icon={icon.includes(":") ? icon : `lucide:${icon}`} width="18" height="18" class="shrink-0"></iconify-icon>
      {/if}
      {title}
    </span>
    {#if description}
      <span class="text-sm text-muted-foreground">{description}</span>
    {/if}
  </div>
{/snippet}

{#if href}
  <a
    {href}
    class="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-colors hover:border-primary/30 hover:bg-accent"
  >
    {@render cardContent()}
  </a>
{:else}
  <div
    class="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm"
  >
    {@render cardContent()}
  </div>
{/if}
