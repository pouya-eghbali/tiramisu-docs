<script lang="ts">
  import type { Snippet } from "svelte";
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card/index.js"

  let { title = "Preview", children }: { title?: string; children: Snippet } = $props()
</script>

<Card class="my-4">
  <CardHeader>
    <CardTitle class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</CardTitle>
  </CardHeader>
  <CardContent>
    {@render children()}
  </CardContent>
</Card>
