<script>
  let { meta, children } = $props()
</script>

<svelte:head>
  {#if meta?.title}
    <title>{meta.title}</title>
    <meta property="og:title" content={meta.title} />
  {/if}
  {#if meta?.description}
    <meta name="description" content={meta.description} />
    <meta property="og:description" content={meta.description} />
  {/if}
</svelte:head>

{#key meta?.title}
<article class="doc-content doc-animate">
  {#if meta?.title}
    <div class="mb-10 border-b pb-8">
      <h1 class="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
        {meta.title}
      </h1>
      {#if meta?.description}
        <p class="mt-3 text-lg text-muted-foreground">
          {meta.description}
        </p>
      {/if}
    </div>
  {/if}

  <div class="doc-body">
    {@render children()}
  </div>
</article>
{/key}

<style>
  .doc-animate {
    animation: doc-fade-in 0.2s ease-out;
  }

  @keyframes doc-fade-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .doc-body :global(h1),
  .doc-body :global(h2),
  .doc-body :global(h3),
  .doc-body :global(h4),
  .doc-body :global(h5),
  .doc-body :global(h6) {
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--foreground);
    scroll-margin-top: 4rem;
  }

  .doc-body :global(h1) {
    font-size: 2.25rem;
    line-height: 1.2;
    margin-top: 3rem;
    margin-bottom: 1.25rem;
  }

  .doc-body :global(h2) {
    font-size: 1.5rem;
    line-height: 1.33;
    margin-top: 3rem;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
  }

  .doc-body :global(h3) {
    font-size: 1.25rem;
    line-height: 1.4;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
  }

  .doc-body :global(h4) {
    font-size: 1.125rem;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .doc-body :global(h2),
  .doc-body :global(h3),
  .doc-body :global(h4) {
    position: relative;
  }

  .doc-body :global(p) {
    font-size: 1rem;
    line-height: 1.75;
    color: var(--foreground);
    margin-bottom: 1.25rem;
  }

  .doc-body :global(p a),
  .doc-body :global(li a),
  .doc-body :global(td a),
  .doc-body :global(blockquote a) {
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 4px;
    color: var(--foreground);
    transition: opacity 0.2s;
  }

  .doc-body :global(p a:hover),
  .doc-body :global(li a:hover),
  .doc-body :global(td a:hover),
  .doc-body :global(blockquote a:hover) {
    opacity: 0.8;
  }

  .doc-body :global(h1 > a),
  .doc-body :global(h2 > a),
  .doc-body :global(h3 > a),
  .doc-body :global(h4 > a) {
    color: inherit;
    font-weight: inherit;
  }

  .doc-body :global(strong) {
    font-weight: 600;
    color: var(--foreground);
  }

  .doc-body :global(code) {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 500;
    background: var(--muted);
    color: var(--foreground);
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
  }

  .doc-body :global(pre) {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    line-height: 1.7;
    background: oklch(0.975 0 0);
    color: oklch(0.25 0 0);
    padding: 1rem 1.25rem;
    margin: 0;
    overflow-x: auto;
  }

  :global(.dark) .doc-body :global(pre) {
    background: oklch(0.105 0 0);
    color: oklch(0.87 0 0);
  }

  /* Shiki dual-theme: use light colors by default, dark in dark mode */
  .doc-body :global(pre span) {
    color: var(--shiki-light);
  }

  :global(.dark) .doc-body :global(pre span) {
    color: var(--shiki-dark);
  }

  .doc-body :global(pre code) {
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
  }

  .doc-body :global(ul),
  .doc-body :global(ol) {
    padding-left: 1.5rem;
    margin-bottom: 1.25rem;
  }

  .doc-body :global(ul) {
    list-style: disc;
  }

  .doc-body :global(ol) {
    list-style: decimal;
  }

  .doc-body :global(li) {
    font-size: 1rem;
    line-height: 1.75;
    margin-bottom: 0.375rem;
    color: var(--foreground);
  }

  .doc-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.875rem;
  }

  .doc-body :global(th) {
    font-weight: 600;
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 2px solid var(--border);
    color: var(--muted-foreground);
  }

  .doc-body :global(td) {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
  }

  .doc-body :global(tr:last-child td) {
    border-bottom: none;
  }

  .doc-body :global(blockquote) {
    border-left: 2px solid var(--border);
    padding-left: 1.5rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: var(--muted-foreground);
  }

  .doc-body :global(blockquote p) {
    color: var(--muted-foreground);
  }

  .doc-body :global(img) {
    border-radius: var(--radius);
    border: 1px solid var(--border);
    margin: 1.5rem 0;
  }

  .doc-body :global(hr) {
    border: none;
    border-top: 1px solid var(--border);
    margin: 2.5rem 0;
  }

  /* Heading anchor # on hover — uses :global block to avoid scoping pseudo-elements */
  :global(.doc-body h2 > a::before),
  :global(.doc-body h3 > a::before),
  :global(.doc-body h4 > a::before) {
    content: '#';
    position: absolute;
    left: -1.5rem;
    color: var(--muted-foreground);
    font-weight: 400;
    opacity: 0;
    transition: opacity 0.15s;
  }

  :global(.doc-body h2:hover > a::before),
  :global(.doc-body h3:hover > a::before),
  :global(.doc-body h4:hover > a::before) {
    opacity: 0.6;
  }
</style>

