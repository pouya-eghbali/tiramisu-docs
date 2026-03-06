<script>
  let { variant = "default", children } = $props()

  const styles = {
    default: "bg-primary/10 text-primary",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive/10 text-destructive",
    outline: "border border-border text-foreground",
  }
</script>

<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold {styles[variant] ?? styles.default}">
  {@render children()}
</span>
