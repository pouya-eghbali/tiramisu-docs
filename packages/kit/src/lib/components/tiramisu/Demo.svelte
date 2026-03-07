<script>
  import { Card, CardContent, CardHeader, CardTitle } from "../ui/card/index.js"

  let { title = "Preview", children } = $props()
</script>

<Card class="my-4">
  <CardHeader>
    <CardTitle class="text-xs font-medium tracking-wide text-muted-foreground uppercase">{title}</CardTitle>
  </CardHeader>
  <CardContent>
    {@render children()}
  </CardContent>
</Card>
