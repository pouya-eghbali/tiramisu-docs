<script>
  let { tabs = [], children } = $props()
  let activeTab = $state(0)
</script>

<div class="my-4">
  <div class="flex border-b border-border">
    {#each tabs as tab, i}
      <button
        class="px-4 py-2 text-sm font-medium transition-colors {activeTab === i ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}"
        onclick={() => activeTab = i}
      >
        {tab.label}
      </button>
    {/each}
  </div>
  <div class="py-4">
    {#if tabs[activeTab]?.content}
      {@html tabs[activeTab].content}
    {:else if children}
      {@render children()}
    {/if}
  </div>
</div>
