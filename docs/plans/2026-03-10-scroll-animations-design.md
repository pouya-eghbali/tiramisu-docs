# Scroll Animations — Landing Page

## Overview

Add subtle scroll-triggered animations to the landing page using GSAP + ScrollTrigger. Elements fade-up on first viewport entry; select decorative elements have parallax depth.

## Approach

GSAP + ScrollTrigger. All animations trigger once (`once: true`). Fade-ups use `gsap.from()` with `scrollTrigger`. Parallax uses `scrub: true` for continuous scroll-linked movement.

## Per-Section Animations

| Section | Type | Details |
|---------|------|---------|
| Hero | Parallax + staggered fade-up | Background blur orbs + DitheredImage parallax at 0.3-0.5x speed. Badge, h1, p, buttons stagger in. |
| Screenshot | Fade-up + scale | `scale(0.97) → 1`, `opacity: 0 → 1`, `translateY(40px) → 0` |
| Intro blurb | Fade-up | Single paragraph block fades up |
| Quick start | Staggered fade-up + parallax | Terminal card then copy buttons stagger. "Easy as cake" image has parallax. |
| No MDX Hell | Staggered fade-up | Heading first, then code cards left-to-right, then checkmarks |
| CTA footer | Fade-up + parallax | Content fades up. Decorative gradient blob has parallax. |

## Implementation Details

- Register in `onMount`, clean up on destroy via `ScrollTrigger.killAll()` or context revert
- Initial state: `opacity: 0; y: 40` via GSAP `from()`
- Parallax: `ScrollTrigger` with `scrub: true`, `y` offset on background elements
- Stagger: `stagger: 0.1` for grouped children
- Trigger: `top 85%` viewport threshold
- Duration: 0.8s for fade-ups
- Easing: `power2.out`
- All animations fire once — no re-trigger on scroll back

## Dependencies

- `gsap` (already have `@types/gsap` in devDeps, need to install `gsap` itself)
- `gsap/ScrollTrigger` (bundled with gsap)
