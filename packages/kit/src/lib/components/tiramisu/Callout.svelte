<script>
  let { type = "info", children } = $props()

  const styles = {
    info: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    error: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
    success: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300",
  }
</script>

<div class="my-4 rounded-lg border-l-4 p-4 {styles[type] ?? styles.info}" role="alert">
  {@render children()}
</div>
