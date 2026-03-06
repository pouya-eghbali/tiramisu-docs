<script>
  let { language = "", code = "", children } = $props()
</script>

<div class="group relative my-4">
  {#if language}
    <div class="absolute right-3 top-2 text-xs text-muted-foreground opacity-70">
      {language}
    </div>
  {/if}
  <pre class="overflow-x-auto rounded-lg border border-border bg-muted p-4"><code class="text-sm">{@html code}</code></pre>
</div>
