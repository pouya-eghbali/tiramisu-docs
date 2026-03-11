# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a product landing page for Tiramisu Docs at the playground root route (`/`).

**Architecture:** Single Svelte 5 component at `playground/src/routes/+page.svelte` with 8 sections. Uses existing theme CSS variables, `iconify-icon` for icons, and Geist font. No new dependencies. Placeholder images until user provides real assets.

**Tech Stack:** Svelte 5, Tailwind CSS 4, iconify-icon, existing app.css theme

---

### Context

- **Root layout:** `playground/src/routes/+layout.svelte` — imports `../app.css` and renders `{@render children()}`
- **Theme:** CSS custom properties defined in `playground/src/app.css` — `--background`, `--foreground`, `--primary`, `--muted`, `--muted-foreground`, `--border`, `--card`, `--card-foreground`, etc.
- **Fonts:** Geist and Geist Mono loaded via Google Fonts in `app.html`, available as `--font-sans` and `--font-mono`
- **Dark mode:** Toggle adds `.dark` class to `<html>`, CSS variables swap automatically
- **Icons:** `iconify-icon` web component, import via `import "iconify-icon"`
- **Existing components to reference for style:** `packages/kit/src/lib/components/tiramisu/NavCard.svelte` (card style), `packages/kit/src/lib/components/Footer.svelte` (Powered by Tiramisu element)
- **Placeholder images:** Use `/hero-bg.jpg` for background, `/docs-screenshot.png` for screenshot. User will provide real files later.

---

### Task 1: Scaffold page with Navbar + Hero section

**Files:**
- Create: `playground/src/routes/+page.svelte`
- Create: `playground/static/hero-bg.jpg` (placeholder — 1x1 dark pixel or skip, use CSS fallback)

**Step 1: Create the page file with navbar and hero**

```svelte
<script>
  import "iconify-icon"

  let dark = $state(false)

  function initTheme() {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("theme")
    dark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.classList.toggle("dark", dark)
  }

  function toggleTheme() {
    dark = !dark
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
  }

  $effect(() => { initTheme() })
</script>

<div class="min-h-screen bg-background text-foreground">
  <!-- Navbar -->
  <nav class="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
      <a href="/" class="flex items-center gap-2 text-sm font-bold">
        Tiramisu Docs
      </a>
      <div class="flex items-center gap-4">
        <a href="/docs" class="text-sm text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
        <a href="https://github.com/user/tiramisu-docs" target="_blank" rel="noopener noreferrer" class="text-sm text-muted-foreground hover:text-foreground transition-colors">GitHub</a>
        <button onclick={toggleTheme} class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Toggle dark mode">
          <svg class="h-4 w-4 dark:hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path><path d="M12 20v2"></path>
            <path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path>
            <path d="M2 12h2"></path><path d="M20 12h2"></path>
            <path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>
          </svg>
          <svg class="hidden h-4 w-4 dark:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
        </button>
      </div>
    </div>
  </nav>

  <!-- Hero -->
  <section class="relative overflow-hidden pt-14">
    <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('/hero-bg.jpg')"></div>
    <div class="absolute inset-0 bg-black/75"></div>
    <div class="relative mx-auto max-w-6xl px-6 py-24 lg:py-36">
      <span class="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        The docs framework you'll love
      </span>
      <h1 class="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-white lg:text-6xl">
        A delightful language for documentation
      </h1>
      <p class="mt-4 max-w-xl text-lg text-white/70">
        Write docs in Tiramisu markup, get a beautiful site powered by SvelteKit. No MDX, no config files, no friction.
      </p>
      <div class="mt-8 flex gap-3">
        <a href="/docs" class="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Get Started
        </a>
        <a href="https://github.com/user/tiramisu-docs" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors">
          GitHub
        </a>
      </div>
    </div>
    <!-- Docs screenshot -->
    <div class="relative mx-auto max-w-5xl px-6 pb-12">
      <div class="overflow-hidden rounded-xl border border-white/10 shadow-2xl">
        <img src="/docs-screenshot.png" alt="Tiramisu Docs screenshot" class="w-full" />
      </div>
    </div>
  </section>
</div>
```

**Step 2: Verify it renders**

Run: `cd playground && bun run dev`
Visit: `http://localhost:5173/`
Expected: Navbar + hero with dark background, text, buttons, empty image placeholder

**Step 3: Commit**

```bash
git add playground/src/routes/+page.svelte
git commit -m "feat: add landing page with navbar and hero section"
```

---

### Task 2: Intro Blurb + Quick Start sections

**Files:**
- Modify: `playground/src/routes/+page.svelte`

**Step 1: Add sections 2 and 3 after the hero closing `</section>`**

```svelte
  <!-- Intro Blurb -->
  <section class="mx-auto max-w-3xl px-6 py-24 text-center">
    <p class="text-xl leading-relaxed text-foreground lg:text-2xl">
      Tiramisu Docs is a <strong>SvelteKit</strong> documentation framework built around the <strong>Tiramisu markup language</strong>. A clean syntax with no angle brackets, no closing tags, and no import hell. Just write — and get beautiful, fast documentation.
    </p>
  </section>

  <!-- Quick Start -->
  <section class="mx-auto max-w-3xl px-6 pb-24 text-center">
    <h2 class="text-lg font-medium text-muted-foreground">Get started in seconds</h2>
    <div class="mt-6 inline-block rounded-lg border bg-zinc-950 px-6 py-4 text-left font-mono text-sm text-green-400 shadow-lg">
      <span class="select-none text-zinc-500">$ </span>bun create tiramisu-docs
    </div>
  </section>
```

**Step 2: Verify**

Reload page. Expected: large intro paragraph centered, then terminal-style command below.

**Step 3: Commit**

```bash
git add playground/src/routes/+page.svelte
git commit -m "feat: add intro blurb and quick start sections"
```

---

### Task 3: No MDX Hell section

**Files:**
- Modify: `playground/src/routes/+page.svelte`

**Step 1: Add section 4 after Quick Start**

```svelte
  <!-- No MDX Hell -->
  <section class="mx-auto max-w-4xl px-6 py-24">
    <h2 class="text-center text-3xl font-bold tracking-tight lg:text-4xl">No MDX Hell</h2>
    <p class="mt-3 text-center text-muted-foreground">Other tools make you fight your markup. Tiramisu stays out of your way.</p>

    <div class="mt-12 space-y-6">
      <!-- Before: MDX -->
      <div>
        <div class="mb-2 flex items-center gap-2">
          <span class="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500">MDX</span>
        </div>
        <div class="overflow-hidden rounded-lg border bg-zinc-950">
          <pre class="overflow-x-auto p-5 text-sm leading-relaxed text-zinc-300"><code>{`import { Callout } from '../components/Callout'
import { Tabs, Tab } from '../components/Tabs'

<Callout type="warning">
  Don't forget to install the **peer dependencies**.
</Callout>

<Tabs items={['npm', 'yarn', 'pnpm']}>
  <Tab value="npm">
    \`\`\`bash
    npm install my-package
    \`\`\`
  </Tab>
  <Tab value="yarn">
    \`\`\`bash
    yarn add my-package
    \`\`\`
  </Tab>
</Tabs>`}</code></pre>
        </div>
      </div>

      <!-- After: Tiramisu -->
      <div>
        <div class="mb-2 flex items-center gap-2">
          <span class="rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-500">Tiramisu</span>
        </div>
        <div class="overflow-hidden rounded-lg border bg-zinc-950">
          <pre class="overflow-x-auto p-5 text-sm leading-relaxed text-zinc-300"><code>{`callout { type = warning, Don't forget to install the peer dependencies. }

codetabs { group = pkg,
  codetab { label = npm, language = bash, "npm install my-package" },
  codetab { label = yarn, language = bash, "yarn add my-package" }
}`}</code></pre>
        </div>
      </div>
    </div>

    <ul class="mt-8 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-6 sm:justify-center">
      <li class="flex items-center gap-2">
        <iconify-icon icon="lucide:check" width="16" height="16" class="text-green-500"></iconify-icon>
        No imports — built-in functions just work
      </li>
      <li class="flex items-center gap-2">
        <iconify-icon icon="lucide:check" width="16" height="16" class="text-green-500"></iconify-icon>
        No JSX — no angle brackets, no closing tags
      </li>
      <li class="flex items-center gap-2">
        <iconify-icon icon="lucide:check" width="16" height="16" class="text-green-500"></iconify-icon>
        No config — components resolve by convention
      </li>
    </ul>
  </section>
```

**Step 2: Verify**

Reload. Expected: MDX code block with red badge, Tiramisu code block with green badge, 3 check-mark bullets.

**Step 3: Commit**

```bash
git add playground/src/routes/+page.svelte
git commit -m "feat: add No MDX Hell comparison section"
```

---

### Task 4: Features Grid section

**Files:**
- Modify: `playground/src/routes/+page.svelte`

**Step 1: Add section 5 after No MDX Hell**

```svelte
  <!-- Features -->
  <section class="mx-auto max-w-5xl px-6 py-24">
    <h2 class="text-center text-3xl font-bold tracking-tight lg:text-4xl">Everything you need</h2>
    <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {#each [
        { icon: "lucide:folder-tree", title: "File-Based Routing", desc: "Drop a .tiramisu file in src/docs/ and it becomes a page." },
        { icon: "lucide:search", title: "Built-In Search", desc: "Full-text search across all your docs, zero config." },
        { icon: "lucide:paintbrush", title: "Syntax Highlighting", desc: "Powered by Shiki with dual themes and 100+ languages." },
        { icon: "lucide:moon", title: "Dark Mode", desc: "Light and dark themes out of the box." },
        { icon: "lucide:globe", title: "Sections & i18n", desc: "Split docs into sections. Add translations with a folder per locale." },
        { icon: "lucide:bot", title: "AI-Ready", desc: "Built-in MCP server and llms.txt for AI assistants." },
      ] as feature}
        <div class="rounded-xl border bg-card p-6">
          <iconify-icon icon={feature.icon} width="24" height="24" class="text-primary"></iconify-icon>
          <h3 class="mt-3 font-semibold text-card-foreground">{feature.title}</h3>
          <p class="mt-1 text-sm text-muted-foreground">{feature.desc}</p>
        </div>
      {/each}
    </div>
  </section>
```

**Step 2: Verify**

Reload. Expected: 3x2 grid of feature cards with icons.

**Step 3: Commit**

```bash
git add playground/src/routes/+page.svelte
git commit -m "feat: add features grid section"
```

---

### Task 5: How It Works section

**Files:**
- Modify: `playground/src/routes/+page.svelte`

**Step 1: Add section 6 after Features**

```svelte
  <!-- How It Works -->
  <section class="mx-auto max-w-5xl px-6 py-24">
    <h2 class="text-center text-3xl font-bold tracking-tight lg:text-4xl">Three steps to docs</h2>
    <div class="mt-12 grid gap-8 lg:grid-cols-3">
      <div class="text-center">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">1</span>
        <h3 class="mt-4 text-lg font-semibold">Create</h3>
        <div class="mt-2 inline-block rounded-md bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-300">bun create tiramisu-docs</div>
        <p class="mt-2 text-sm text-muted-foreground">One command to scaffold your project.</p>
      </div>
      <div class="text-center">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">2</span>
        <h3 class="mt-4 text-lg font-semibold">Write</h3>
        <div class="mt-2 inline-block rounded-md bg-zinc-950 px-3 py-1.5 font-mono text-xs text-zinc-300 text-left">
          h2 &#123; Hello World &#125;<br/>
          list &#123; Fast, Simple, Beautiful &#125;
        </div>
        <p class="mt-2 text-sm text-muted-foreground">Clean, readable markup. No boilerplate.</p>
      </div>
      <div class="text-center">
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">3</span>
        <h3 class="mt-4 text-lg font-semibold">Ship</h3>
        <iconify-icon icon="lucide:rocket" width="24" height="24" class="mt-2 text-muted-foreground"></iconify-icon>
        <p class="mt-2 text-sm text-muted-foreground">Your docs are live. Routing, search, and navigation — all automatic.</p>
      </div>
    </div>
  </section>
```

**Step 2: Verify**

Reload. Expected: 3 columns with numbered circles, titles, mini code/icon, descriptions.

**Step 3: Commit**

```bash
git add playground/src/routes/+page.svelte
git commit -m "feat: add How It Works section"
```

---

### Task 6: Built with SvelteKit + CTA Footer sections

**Files:**
- Modify: `playground/src/routes/+page.svelte`

**Step 1: Add sections 7 and 8 after How It Works, and close the outer `</div>`**

```svelte
  <!-- Built with SvelteKit -->
  <section class="mx-auto max-w-3xl px-6 py-24 text-center">
    <h2 class="text-3xl font-bold tracking-tight lg:text-4xl">Powered by SvelteKit</h2>
    <p class="mt-4 text-muted-foreground">
      Built on Svelte 5 and Vite. Fast builds, instant HMR, and the full power of SvelteKit when you need it. Every component is overridable — swap any built-in with your own.
    </p>
    <div class="mt-8 flex items-center justify-center gap-8">
      {#each [
        { icon: "devicon-plain:svelte", label: "Svelte 5" },
        { icon: "devicon-plain:vitejs", label: "Vite" },
        { icon: "devicon-plain:tailwindcss", label: "Tailwind CSS" },
      ] as tech}
        <div class="flex flex-col items-center gap-2">
          <iconify-icon icon={tech.icon} width="32" height="32" class="text-muted-foreground"></iconify-icon>
          <span class="text-xs text-muted-foreground">{tech.label}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- CTA Footer -->
  <section class="border-t bg-muted/30 py-24 text-center">
    <h2 class="text-3xl font-bold tracking-tight lg:text-4xl">Build your docs</h2>
    <p class="mt-3 text-muted-foreground">Get started with Tiramisu Docs in minutes.</p>
    <div class="mt-8 flex justify-center gap-3">
      <a href="/docs" class="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
        Get Started
      </a>
      <a href="https://github.com/user/tiramisu-docs" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">
        GitHub
      </a>
    </div>
    <!-- Powered by Tiramisu -->
    <div class="mt-12">
      <a
        href="https://github.com/user/tiramisu-docs"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg class="h-3 w-3 dark:hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="16" width="18" height="3" rx="1" fill="#5c4a3a"/>
          <rect x="4" y="11" width="16" height="3" rx="1" fill="#7a6555"/>
          <rect x="5" y="6" width="14" height="3" rx="1" fill="#3e2e22"/>
          <circle cx="8" cy="4" r="0.7" fill="#5c4a3a"/>
          <circle cx="12" cy="3.5" r="0.7" fill="#3e2e22"/>
          <circle cx="16" cy="4" r="0.7" fill="#5c4a3a"/>
        </svg>
        <svg class="hidden h-3 w-3 dark:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="16" width="18" height="3" rx="1" fill="#e8e0d8" opacity="0.35"/>
          <rect x="4" y="11" width="16" height="3" rx="1" fill="#e8e0d8" opacity="0.6"/>
          <rect x="5" y="6" width="14" height="3" rx="1" fill="#e8e0d8" opacity="0.9"/>
          <circle cx="8" cy="4" r="0.7" fill="#e8e0d8" opacity="0.45"/>
          <circle cx="12" cy="3.5" r="0.7" fill="#e8e0d8" opacity="0.6"/>
          <circle cx="16" cy="4" r="0.7" fill="#e8e0d8" opacity="0.45"/>
        </svg>
        Powered by Tiramisu
      </a>
    </div>
  </section>
</div>
```

**Step 2: Verify**

Reload. Expected: tech logos row, then full CTA section with buttons and Powered by Tiramisu footer.

**Step 3: Build test**

Run: `cd playground && bun run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add playground/src/routes/+page.svelte
git commit -m "feat: add SvelteKit section and CTA footer, complete landing page"
```

---

### Task 7: Polish and responsive fixes

**Files:**
- Modify: `playground/src/routes/+page.svelte`

**Step 1: Review and fix**

Open the page at mobile widths (375px, 768px) and desktop (1280px+). Check:
- Navbar collapses gracefully (links stay visible — no hamburger needed for 2 links)
- Hero text doesn't overflow on small screens
- Features grid goes 1-col on mobile, 2-col on tablet, 3-col on desktop
- How It Works stacks vertically on mobile
- Code blocks in No MDX Hell scroll horizontally on mobile
- Tech logos row wraps if needed
- All text is readable against backgrounds in both light and dark mode

Fix any spacing, font size, or layout issues found.

**Step 2: Verify light + dark mode**

Toggle theme. All sections should look correct in both modes. Hero overlay should keep text readable. Code blocks should stay dark in both modes.

**Step 3: Commit**

```bash
git add playground/src/routes/+page.svelte
git commit -m "fix: responsive and dark mode polish for landing page"
```
