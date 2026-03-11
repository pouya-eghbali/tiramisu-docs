<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props()
</script>

<div class="stepper my-6">
  {@render children()}
</div>

<style>
  .stepper :global(ol) {
    list-style: none;
    padding-left: 0;
    margin: 0;
    counter-reset: step;
  }

  .stepper :global(li.step) {
    position: relative;
    padding-left: 2.5rem;
    padding-bottom: 1.5rem;
    counter-increment: step;
  }

  .stepper :global(li.step)::before {
    content: counter(step);
    position: absolute;
    left: 0;
    top: 0;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 9999px;
    background: var(--primary);
    color: var(--primary-foreground);
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stepper :global(li.step)::after {
    content: "";
    position: absolute;
    left: 0.8125rem;
    top: 1.75rem;
    width: 2px;
    bottom: 0;
    background: var(--border);
  }

  .stepper :global(li.step:last-child)::after {
    display: none;
  }

  .stepper :global(li.step:last-child) {
    padding-bottom: 0;
  }
</style>
