# Scroll Animations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add subtle GSAP-powered scroll animations (fade-up + parallax) to the landing page.

**Architecture:** GSAP ScrollTrigger registers animations in `onMount`. A reusable `gsap.context()` scopes all animations to the landing page and reverts on destroy. Elements use `gsap.from()` for fade-ups and `scrub: true` for parallax.

**Tech Stack:** GSAP 3.x, ScrollTrigger plugin, Svelte 5 `onMount`

---

### Task 1: Install GSAP

**Files:**
- Modify: `playground/package.json`

**Step 1: Install gsap**

Run: `cd /Users/pouya/Projects/tiramisu-docs/playground && bun add gsap`

This adds `gsap` to dependencies. The existing `@types/gsap` devDep is outdated (GSAP 3 ships its own types), so remove it.

**Step 2: Remove @types/gsap**

Run: `cd /Users/pouya/Projects/tiramisu-docs/playground && bun remove @types/gsap`

**Step 3: Verify import works**

Run: `cd /Users/pouya/Projects/tiramisu-docs/playground && node -e "require('gsap')"`

Expected: No errors.

**Step 4: Commit**

```bash
cd /Users/pouya/Projects/tiramisu-docs/playground
git add package.json bun.lock
git commit -m "feat: add gsap dependency for scroll animations"
```

---

### Task 2: Add data attributes to landing page sections

Mark all animatable elements with `data-*` attributes so GSAP can target them without coupling to Svelte component structure. This keeps the GSAP code separate from the markup.

**Files:**
- Modify: `playground/src/routes/+page.svelte`

**Step 1: Add data attributes to hero section**

Add `data-animate="fade-up"` to these elements inside the hero:
- The `<Badge>` element
- The `<h1>` element
- The `<p>` element (description)
- The `<div>` containing the two Buttons

Add `data-animate="parallax"` to the three background blur `<div>` orbs (the ones with `bg-orange-500/15`, `bg-amber-500/10`, `bg-rose-500/8`).

Add `data-animate="fade-up-scale"` to the screenshot container (the outer `<div>` with `class="relative mx-auto max-w-5xl"`).

**Step 2: Add data attributes to intro blurb**

Add `data-animate="fade-up"` to the `<p>` inside the intro blurb section.

**Step 3: Add data attributes to quick start section**

Add `data-animate="fade-up"` with `data-stagger-group="quickstart"` to:
- The `Card.Root` (terminal)
- The copy buttons `<div>` container

Add `data-animate="parallax"` to the "Easy as cake" right-side `<div>`.

**Step 4: Add data attributes to No MDX Hell section**

Add `data-animate="fade-up"` to:
- The `<h2>` heading
- The `<p>` subtitle

Add `data-animate="fade-up"` with `data-stagger-group="comparison"` to:
- The MDX code card `<div>`
- The Tiramisu code card `<div>`

Add `data-animate="fade-up"` to the checkmarks flex container.

**Step 5: Add data attributes to CTA footer**

Add `data-animate="fade-up"` to the inner content `<div>` (`relative mx-auto max-w-2xl text-center`).

Add `data-animate="parallax"` to the decorative gradient blob `<div>` (the one with `bg-amber-500/8`).

**Step 6: Commit**

```bash
git add playground/src/routes/+page.svelte
git commit -m "feat: add data attributes for scroll animation targets"
```

---

### Task 3: Implement GSAP scroll animations

Wire up GSAP ScrollTrigger in `onMount`. Use `gsap.context()` for cleanup.

**Files:**
- Modify: `playground/src/routes/+page.svelte` (script block)

**Step 1: Add GSAP imports and registration**

At the top of the `<script>` block, after the existing imports, add:

```ts
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
```

**Step 2: Add scroll animation setup in onMount**

There is already an `onMount` for the terminal typing animation. Add a second `onMount` (Svelte 5 supports multiple). Add this after the existing `onMount` block:

```ts
onMount(() => {
  const ctx = gsap.context(() => {
    // Fade-up animations
    gsap.utils.toArray<HTMLElement>("[data-animate='fade-up']").forEach((el) => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    });

    // Staggered fade-up (elements in the same group animate sequentially)
    const groups = new Map<string, HTMLElement[]>();
    gsap.utils.toArray<HTMLElement>("[data-stagger-group]").forEach((el) => {
      const group = el.dataset.staggerGroup!;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(el);
    });

    groups.forEach((elements) => {
      gsap.from(elements, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: elements[0],
          start: "top 85%",
          once: true,
        },
      });
    });

    // Fade-up with scale (screenshot)
    gsap.utils.toArray<HTMLElement>("[data-animate='fade-up-scale']").forEach((el) => {
      gsap.from(el, {
        y: 60,
        opacity: 0,
        scale: 0.97,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    });

    // Parallax (background elements scroll at reduced speed)
    gsap.utils.toArray<HTMLElement>("[data-animate='parallax']").forEach((el) => {
      gsap.to(el, {
        y: -80,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
        },
      });
    });
  }, ".landing");

  return () => ctx.revert();
});
```

Key points:
- `gsap.context(() => {}, ".landing")` scopes all selectors to the landing page
- `ctx.revert()` in the cleanup function kills all ScrollTriggers and resets styles
- Stagger groups are collected by `data-stagger-group` value, then animated together
- Parallax uses `scrub: 0.5` for smooth scroll-linked movement
- All fade-ups use `once: true`

**Step 3: Verify the page loads without errors**

Run: `cd /Users/pouya/Projects/tiramisu-docs/playground && bun run build`

Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add playground/src/routes/+page.svelte
git commit -m "feat: wire up GSAP scroll animations on landing page"
```

---

### Task 4: Visual QA and tuning

**Files:**
- Modify: `playground/src/routes/+page.svelte` (if adjustments needed)

**Step 1: Dev server check**

The user runs the dev server themselves. After implementation, verify:
- Hero: badge, h1, p, buttons fade up with stagger on page load
- Screenshot: fades up with subtle scale
- Background orbs: drift upward slightly as you scroll (parallax)
- Intro blurb: fades up when scrolled into view
- Quick start: terminal then buttons stagger in
- "Easy as cake" panel: has parallax depth
- No MDX Hell: heading first, then cards stagger left-to-right, then checkmarks
- CTA: content fades up, gradient blob has parallax
- All animations trigger once — scrolling back up doesn't replay them
- No layout shift or flash of unstyled content

**Step 2: Commit any tweaks**

```bash
git add playground/src/routes/+page.svelte
git commit -m "fix: tune scroll animation timing and offsets"
```
