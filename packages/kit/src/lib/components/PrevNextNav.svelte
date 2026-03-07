<script>
  let { sidebar = [], currentSlug = "", locale } = $props()

  function docHref(slug) {
    const prefix = locale ? `/docs/${locale}` : "/docs"
    return slug === "index" ? prefix : `${prefix}/${slug}`
  }

  function flattenEntries(entries) {
    const result = []
    for (const entry of entries) {
      if (entry.type === "item") {
        result.push({
          title: entry.title,
          href: docHref(entry.slug),
          slug: entry.slug,
        })
      } else if (entry.type === "subgroup") {
        if (entry.slug) {
          result.push({
            title: entry.label,
            href: docHref(entry.slug),
            slug: entry.slug,
          })
        }
        result.push(...flattenEntries(entry.items))
      }
    }
    return result
  }

  const items = $derived(
    sidebar.flatMap((group) => flattenEntries(group.items))
  )

  const currentIndex = $derived(
    items.findIndex((item) => item.slug === (currentSlug || "index"))
  )

  const prev = $derived(currentIndex > 0 ? items[currentIndex - 1] : null)
  const next = $derived(currentIndex < items.length - 1 ? items[currentIndex + 1] : null)
</script>

{#if prev || next}
  <nav class="mt-16 flex gap-4 border-t pt-8">
    {#if prev}
      <a
        href={prev.href}
        class="group flex flex-1 flex-col gap-1 rounded-lg border p-4 transition-colors hover:border-foreground/20 hover:bg-muted/50"
      >
        <span class="text-xs text-muted-foreground">Previous</span>
        <span class="font-medium text-foreground group-hover:text-foreground/80">
          &larr; {prev.title}
        </span>
      </a>
    {:else}
      <div class="flex-1"></div>
    {/if}
    {#if next}
      <a
        href={next.href}
        class="group flex flex-1 flex-col items-end gap-1 rounded-lg border p-4 text-right transition-colors hover:border-foreground/20 hover:bg-muted/50"
      >
        <span class="text-xs text-muted-foreground">Next</span>
        <span class="font-medium text-foreground group-hover:text-foreground/80">
          {next.title} &rarr;
        </span>
      </a>
    {:else}
      <div class="flex-1"></div>
    {/if}
  </nav>
{/if}
