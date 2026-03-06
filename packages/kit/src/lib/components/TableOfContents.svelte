<script>
  let { headings } = $props()
</script>

<nav class="sticky top-20 space-y-2">
  <h4 class="text-sm font-semibold">On this page</h4>
  <ul class="space-y-1 text-sm">
    {#each headings as heading}
      <li style="padding-left: {(heading.level - 1) * 0.75}rem">
        <a href="#{heading.id}" class="text-muted-foreground hover:text-foreground transition-colors">
          {heading.text}
        </a>
      </li>
    {/each}
  </ul>
</nav>
