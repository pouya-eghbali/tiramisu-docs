<script>
  let { headings } = $props()
  let activeId = $state("")

  $effect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeId = entry.target.id
          }
        }
      },
      { rootMargin: "-64px 0px -75% 0px" }
    )

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean)

    for (const el of elements) observer.observe(el)

    return () => observer.disconnect()
  })
</script>

<nav>
  <p class="mb-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-60"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
    On this page
  </p>
  <ul class="space-y-0.5 border-l border-border">
    {#each headings as heading}
      {@const active = activeId === heading.id}
      <li style="padding-left: {(heading.level - 2) * 0.75}rem">
        <a
          href="#{heading.id}"
          class="block -ml-px py-1 pl-3 text-[13px] transition-colors
            {active
              ? 'border-l-2 border-primary font-medium text-primary'
              : 'text-muted-foreground hover:text-foreground'}"
        >
          {heading.text}
        </a>
      </li>
    {/each}
  </ul>
</nav>
