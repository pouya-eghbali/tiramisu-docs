<script>
  let { meta, children } = $props()
</script>

<article class="prose prose-neutral dark:prose-invert max-w-none">
  {#if meta?.title}
    <h1>{meta.title}</h1>
  {/if}
  {#if meta?.description}
    <p class="lead text-muted-foreground">{meta.description}</p>
  {/if}
  {@render children()}
</article>
