<script>
  import { page } from "$app/stores"

  let { groups } = $props()
</script>

<nav class="sticky top-20 space-y-6">
  {#each groups as group}
    <div>
      <h4 class="mb-2 text-sm font-semibold">{group.label}</h4>
      <ul class="space-y-1">
        {#each group.items as item}
          <li>
            <a
              href="/docs/{item.slug}"
              class="block rounded-md px-3 py-1.5 text-sm transition-colors {$page.url.pathname === `/docs/${item.slug}` ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}"
            >
              {item.title}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</nav>
