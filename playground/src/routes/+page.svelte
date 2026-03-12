<script lang="ts">
  import "iconify-icon";
  import { onMount } from "svelte";
  import gsap from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";
  import { TopBar, SearchDialog } from "@tiramisu-docs/kit/components";
  import config from "$lib/tiramisu.config";
  import { resolveConfig, buildInstantOgUrl } from "@tiramisu-docs/kit";
  import { DitheredImage } from "$lib/motion-core";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import * as Card from "$lib/components/ui/card";

  const resolved = resolveConfig(config);
  const ogImage = resolved.instantOg && resolved.url
    ? buildInstantOgUrl(resolved.url, resolved.instantOg)
    : undefined;

  let searchOpen = $state(false);
  let dark = $state(true);

  onMount(() => {
    const el = document.documentElement;
    dark = el.classList.contains("dark");
    const observer = new MutationObserver(() => {
      dark = el.classList.contains("dark");
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  });

  const commands: Record<string, string> = {
    bun: "bun create tiramisu-docs",
    npm: "npx create-tiramisu-docs",
    pnpm: "pnpm create tiramisu-docs",
  };

  let copiedPkg = $state<string | null>(null);

  async function copyCommand(pkg: string) {
    await navigator.clipboard.writeText(commands[pkg]);
    copiedPkg = pkg;
    setTimeout(() => (copiedPkg = null), 2000);
  }

  // Terminal animation
  interface TermLine {
    type: string;
    text?: string;
    value?: string;
  }
  const lines: TermLine[] = [
    { type: "command", text: "bun create tiramisu-docs" },
    { type: "blank" },
    { type: "output", text: "┌  Create Tiramisu Docs" },
    { type: "output", text: "│" },
    { type: "prompt", text: "◆  Project name: ", value: "my-docs" },
    { type: "output", text: "│" },
    { type: "prompt", text: "◆  Package manager: ", value: "bun" },
    { type: "output", text: "│" },
    { type: "output", text: "└  Done! 🍰" },
  ];

  let visibleLines: TermLine[] = $state([]);
  let currentTyping = $state("");
  let typingLineIdx = $state(-1);

  onMount(() => {
    let i = 0;
    let charIdx = 0;
    let timeout: ReturnType<typeof setTimeout>;

    function typeNext() {
      if (i >= lines.length) {
        // Restart after a pause
        timeout = setTimeout(() => {
          visibleLines = [];
          currentTyping = "";
          typingLineIdx = -1;
          i = 0;
          charIdx = 0;
          typeNext();
        }, 3000);
        return;
      }

      const line = lines[i];

      if (line.type === "command") {
        typingLineIdx = i;
        if (charIdx <= line.text!.length) {
          currentTyping = line.text!.slice(0, charIdx);
          charIdx++;
          timeout = setTimeout(typeNext, 40 + Math.random() * 40);
        } else {
          visibleLines = [...visibleLines, line];
          typingLineIdx = -1;
          currentTyping = "";
          charIdx = 0;
          i++;
          timeout = setTimeout(typeNext, 300);
        }
      } else if (line.type === "prompt") {
        typingLineIdx = i;
        if (charIdx === 0) {
          visibleLines = [...visibleLines, { ...line, value: "" }];
        }
        if (charIdx < line.value!.length) {
          charIdx++;
          visibleLines[visibleLines.length - 1] = {
            ...line,
            value: line.value!.slice(0, charIdx),
          };
          visibleLines = visibleLines;
          timeout = setTimeout(typeNext, 60 + Math.random() * 40);
        } else {
          typingLineIdx = -1;
          charIdx = 0;
          i++;
          timeout = setTimeout(typeNext, 200);
        }
      } else {
        visibleLines = [...visibleLines, line];
        i++;
        timeout = setTimeout(typeNext, line.type === "blank" ? 100 : 80);
      }
    }

    timeout = setTimeout(typeNext, 800);
    return () => clearTimeout(timeout);
  });

  onMount(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Prevent flash of unstyled content
      gsap.set("[data-animate='fade-up']:not([data-stagger-group])", {
        opacity: 0,
        y: 40,
      });
      gsap.set("[data-stagger-group]", { opacity: 0, y: 40 });
      gsap.set("[data-animate='fade-up-scale']", {
        opacity: 0,
        y: 60,
        scale: 0.97,
      });

      // Fade-up animations (exclude stagger-group elements, handled separately)
      gsap.utils
        .toArray<HTMLElement>(
          "[data-animate='fade-up']:not([data-stagger-group])",
        )
        .forEach((el) => {
          gsap.to(el, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true,
            },
          });
        });

      // Staggered fade-up
      const groups = new Map<string, HTMLElement[]>();
      gsap.utils.toArray<HTMLElement>("[data-stagger-group]").forEach((el) => {
        const group = el.dataset.staggerGroup!;
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group)!.push(el);
      });

      groups.forEach((elements) => {
        gsap.to(elements, {
          y: 0,
          opacity: 1,
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
      gsap.utils
        .toArray<HTMLElement>("[data-animate='fade-up-scale']")
        .forEach((el) => {
          gsap.to(el, {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true,
            },
          });
        });

      // Parallax
      gsap.utils
        .toArray<HTMLElement>("[data-animate='parallax']")
        .forEach((el) => {
          const parent = el.parentElement;
          if (!parent) return;
          const yOffset = Number(el.dataset.parallaxY) || -80;
          console.log(el, el.dataset.parallaxY);
          gsap.to(el, {
            y: yOffset,
            ease: "none",
            scrollTrigger: {
              trigger: parent,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.5,
            },
          });
        });
    }, ".landing");

    return () => ctx.revert();
  });
</script>

<svelte:head>
  <title>{resolved.title}</title>
  <meta name="description" content={resolved.description} />
  <meta property="og:title" content={resolved.title} />
  <meta property="og:description" content={resolved.description} />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
  <meta name="twitter:title" content={resolved.title} />
  <meta name="twitter:description" content={resolved.description} />
  {#if ogImage}
    <meta property="og:image" content={ogImage} />
    <meta name="twitter:image" content={ogImage} />
  {/if}
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: resolved.title,
    description: resolved.description,
  })}</script>`}
</svelte:head>

<div class="landing bg-background">
  <TopBar
    config={resolved}
    sections={resolved.sections ?? []}
    onSearchClick={() => (searchOpen = true)}
  />

  <!-- ==================== HERO ==================== -->
  <section
    class="bg-background relative overflow-hidden pt-14 mx-4 md:mx-auto md:max-w-[85%]
    lg:max-w-3/4 mt-6 sm:mt-16 rounded-2xl mb-16 sm:mb-28"
  >
    <div
      class="absolute bottom-0 left-0 right-0 bg-linear-to-b from-transparent dark:to-background h-24 z-3"
    ></div>
    <div
      class="absolute bottom-0 left-0 right-0 bg-linear-to-br from-background/80 to-transparent h-full w-full z-2"
    ></div>
    <!-- Background image + gradient overlay -->
    <div class="pointer-events-none absolute inset-0">
      <DitheredImage
        src="/images/tiramisu-hero.jpg"
        alt=""
        class="absolute inset-0 h-full w-full object-cover z-1 opacity-75 scale-115"
        pixelSize={2}
        threshold={0.05}
        ditherMap="halftone"
        backgroundColor={dark ? "#111113" : "#ffffff"}
        data-animate="parallax"
      />
    </div>

    <div
      class="relative mx-auto max-w-90rem min-h-[400px] md:min-h-[600px] md:h-[70vh] max-h-[900px] px-6 lg:px-12 pb-8 z-2"
    >
      <div class="max-w-2xl">
        <Badge
          variant="secondary"
          data-animate="fade-up"
          data-stagger-group="hero"
          class="font-bold px-2"
        >
          The docs framework you'll love
        </Badge>
        <h1
          data-animate="fade-up"
          data-stagger-group="hero"
          class="mt-6 text-3xl font-bold tracking-tight dark:text-white sm:text-5xl lg:text-6xl"
        >
          A delightful language<br />for documentation.
        </h1>
        <p
          data-animate="fade-up"
          data-stagger-group="hero"
          class="mt-5 max-w-lg text-base leading-relaxed dark:text-zinc-200 sm:text-lg font-bold"
        >
          Write docs in Tiramisu markup, get a beautiful site powered by
          SvelteKit. No MDX, no config files, no friction.
        </p>
        <div
          data-animate="fade-up"
          data-stagger-group="hero"
          class="mt-8 flex items-center gap-3"
        >
          <Button href="/docs" size="lg">
            <iconify-icon icon="lucide:arrow-right" width="16" height="16"
            ></iconify-icon>
            Get Started
          </Button>
          <Button
            href="https://github.com/pouya-eghbali/tiramisu-docs"
            variant="secondary"
            size="lg"
            target="_blank"
            rel="noopener noreferrer"
          >
            <iconify-icon icon="mdi:github" width="18" height="18"
            ></iconify-icon>
            GitHub
          </Button>
        </div>
      </div>
    </div>

    <!-- Screenshot -->
    <div
      data-animate="fade-up-scale"
      class="hidden md:block absolute right-0 top-[400px] right-[-36px] w-[80%] px-6 pt-8 pb-0 z-2 dark"
    >
      <div
        class="overflow-hidden rounded-t-xl border border-b-0 border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 ring-1 ring-white/5"
      >
        <img
          src="/images/tiramisu-docs.png"
          alt="Tiramisu Docs preview"
          class="w-full"
        />
      </div>
    </div>
  </section>

  <!-- ==================== INTRO BLURB ==================== -->
  <section class="bg-background px-4 sm:px-6 py-14 sm:py-20 lg:py-28">
    <p
      data-animate="fade-up"
      class="mx-auto max-w-[90%] sm:max-w-[80%] lg:max-w-2/3 text-center text-lg sm:text-xl md:text-2xl lg:text-4xl text-muted-foreground font-light leading-snug"
    >
      Tiramisu Docs is a <strong class="font-bold">SvelteKit</strong>
      documentation framework built around the
      <strong class="font-bold">Tiramisu markup language</strong>. A clean
      syntax with no angle brackets, no closing tags, and no import hell. Just
      write — and get beautiful, fast documentation.
    </p>
  </section>

  <!-- ==================== QUICK START ==================== -->
  <section class="bg-background px-4 sm:px-6 py-14 sm:py-20 lg:py-28">
    <div
      class="mx-auto grid max-w-[90%] md:max-w-[85%] lg:max-w-3/4 items-stretch gap-10 lg:grid-cols-[1fr_1fr]"
    >
      <!-- Left: terminal + copy buttons -->
      <div class="flex flex-col gap-4">
        <!-- Animated terminal -->
        <Card.Root
          data-animate="fade-up"
          data-stagger-group="quickstart"
          class="gap-0 py-0 overflow-hidden"
        >
          <Card.Header
            class="flex flex-row items-center gap-1.5 border-b px-4 py-3!"
          >
            <div class="h-2.5 w-2.5 rounded-full bg-muted-foreground/25"></div>
            <div class="h-2.5 w-2.5 rounded-full bg-muted-foreground/25"></div>
            <div class="h-2.5 w-2.5 rounded-full bg-muted-foreground/25"></div>
          </Card.Header>
          <Card.Content
            class="h-72 overflow-hidden p-5 font-mono text-base leading-none"
          >
            {#each visibleLines as line, idx}
              {#if line.type === "command"}
                <div class="flex items-center gap-2">
                  <span class="select-none text-muted-foreground">$</span>
                  <span class="text-green-600 dark:text-green-400"
                    >{line.text}</span
                  >
                </div>
              {:else if line.type === "blank"}
                <div class="h-5"></div>
              {:else if line.type === "prompt"}
                <div class="text-muted-foreground">
                  {line.text}<span class="text-foreground">{line.value}</span
                  >{#if idx === visibleLines.length - 1 && typingLineIdx >= 0 && lines[typingLineIdx]?.type === "prompt"}<span
                      class="terminal-cursor">▋</span
                    >{/if}
                </div>
              {:else}
                <div class="text-muted-foreground">{line.text}</div>
              {/if}
            {/each}
            {#if typingLineIdx >= 0 && lines[typingLineIdx]?.type === "command"}
              <div class="flex items-center gap-2">
                <span class="select-none text-muted-foreground">$</span>
                <span class="text-green-600 dark:text-green-400"
                  >{currentTyping}</span
                ><span class="terminal-cursor">▋</span>
              </div>
            {/if}
          </Card.Content>
        </Card.Root>

        <!-- Copy buttons -->
        <div
          data-animate="fade-up"
          data-stagger-group="quickstart"
          class="grid grid-cols-3 gap-2"
        >
          {#each Object.entries(commands) as [pkg, cmd]}
            <Button
              variant="outline"
              class="w-full justify-between"
              onclick={() => copyCommand(pkg)}
            >
              <span class="flex items-center gap-2">
                <iconify-icon icon="devicon-plain:{pkg}" width="16" height="16"
                ></iconify-icon>
                {pkg}
              </span>
              {#if copiedPkg === pkg}
                <iconify-icon
                  icon="lucide:check"
                  width="14"
                  height="14"
                  class="text-green-500"
                ></iconify-icon>
              {:else}
                <iconify-icon icon="lucide:copy" width="14" height="14"
                ></iconify-icon>
              {/if}
            </Button>
          {/each}
        </div>
      </div>

      <!-- Right: tagline -->
      <div
        class="relative flex min-h-60 sm:min-h-72 lg:min-h-full items-center justify-center overflow-hidden rounded-2xl lg:justify-start"
      >
        <DitheredImage
          src="/images/tiramisu-glass.jpg"
          alt=""
          class="absolute inset-0 h-full w-full object-cover opacity-35"
          pixelSize={2}
          threshold={0.05}
          ditherMap="halftone"
          backgroundColor={dark ? "#111113" : "#ffffff"}
        />
        <h2
          data-animate="fade-up"
          class="hidden md:block relative z-2 px-10 text-5xl font-bold tracking-tight dark:text-white lg:text-7xl"
        >
          Easy<br />as<br />cake.
        </h2>
        <h2
          data-animate="fade-up"
          class="md:hidden relative z-2 px-10 text-4xl font-bold tracking-tight dark:text-white lg:text-7xl"
        >
          Easy as cake.
        </h2>
      </div>
    </div>
  </section>

  <!-- ==================== NO MDX HELL ==================== -->
  <section class="bg-background px-4 sm:px-6 py-14 sm:py-20 lg:py-28">
    <div class="mx-auto max-w-[90%] md:max-w-[85%] lg:max-w-3/4">
      <div class="mb-12 text-center">
        <h2
          data-animate="fade-up"
          class="text-2xl sm:text-3xl font-bold tracking-tight lg:text-4xl"
        >
          No MDX Hell.
        </h2>
        <p data-animate="fade-up" class="mt-3 text-muted-foreground">
          Other tools make you fight your markup. Tiramisu stays out of your
          way.
        </p>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- MDX -->
        <Card.Root
          data-animate="fade-up"
          data-stagger-group="comparison"
          class="code-window gap-0 py-0 overflow-hidden"
        >
          <Card.Header
            class="flex flex-row items-center gap-2 border-b px-4 py-2.5!"
          >
            <div class="flex items-center gap-1.5">
              <div
                class="h-2.5 w-2.5 rounded-full bg-muted-foreground/25"
              ></div>
              <div
                class="h-2.5 w-2.5 rounded-full bg-muted-foreground/25"
              ></div>
              <div
                class="h-2.5 w-2.5 rounded-full bg-muted-foreground/25"
              ></div>
            </div>
            <span class="ml-2 text-xs font-medium text-muted-foreground"
              >component.mdx</span
            >
            <Badge variant="destructive" class="ml-auto">18 lines</Badge>
          </Card.Header>
          <Card.Content class="p-0">
            <pre class="overflow-x-auto p-5 text-[13px] leading-relaxed"><code
                ><span class="tk-kw">import</span> <span class="tk-br"
                  >&#123;</span
                > <span class="tk-id">Callout</span> <span class="tk-br"
                  >&#125;</span
                > <span class="tk-kw">from</span> <span class="tk-str"
                  >'../components/Callout'</span
                >
<span class="tk-kw">import</span> <span class="tk-br">&#123;</span> <span
                  class="tk-id">Tabs</span
                ><span class="tk-pn">,</span> <span class="tk-id">Tab</span
                > <span class="tk-br">&#125;</span> <span class="tk-kw"
                  >from</span
                > <span class="tk-str">'../components/Tabs'</span>

<span class="tk-pn">&lt;</span><span class="tk-tag">Callout</span> <span
                  class="tk-attr">type</span
                ><span class="tk-pn">=</span><span class="tk-str"
                  >"warning"</span
                ><span class="tk-pn">&gt;</span>
  Don't forget to install the <span class="tk-id"
                  >**peer
  dependencies**</span
                >.
<span class="tk-pn">&lt;/</span><span class="tk-tag">Callout</span><span
                  class="tk-pn">&gt;</span
                >

<span class="tk-pn">&lt;</span><span class="tk-tag">Tabs</span> <span
                  class="tk-attr">items</span
                ><span class="tk-pn">=</span><span class="tk-br">&#123;</span
                ><span class="tk-pn">[</span><span class="tk-str">'npm'</span
                ><span class="tk-pn">,</span> <span class="tk-str">'yarn'</span
                ><span class="tk-pn">]</span><span class="tk-br">&#125;</span
                ><span class="tk-pn">&gt;</span>
  <span class="tk-pn">&lt;</span><span class="tk-tag">Tab</span> <span
                  class="tk-attr">value</span
                ><span class="tk-pn">=</span><span class="tk-str">"npm"</span
                ><span class="tk-pn">&gt;</span>
    <span class="tk-pn">```bash</span>
    <span class="tk-id">npm install my-package</span>
    <span class="tk-pn">```</span>
  <span class="tk-pn">&lt;/</span><span class="tk-tag">Tab</span><span
                  class="tk-pn">&gt;</span
                >
  <span class="tk-pn">&lt;</span><span class="tk-tag">Tab</span> <span
                  class="tk-attr">value</span
                ><span class="tk-pn">=</span><span class="tk-str">"yarn"</span
                ><span class="tk-pn">&gt;</span>
    <span class="tk-pn">```bash</span>
    <span class="tk-id">yarn add my-package</span>
    <span class="tk-pn">```</span>
  <span class="tk-pn">&lt;/</span><span class="tk-tag">Tab</span><span
                  class="tk-pn">&gt;</span
                >
<span class="tk-pn">&lt;/</span><span class="tk-tag">Tabs</span><span
                  class="tk-pn">&gt;</span
                ></code
              ></pre>
          </Card.Content>
        </Card.Root>

        <!-- Tiramisu -->
        <Card.Root
          data-animate="fade-up"
          data-stagger-group="comparison"
          class="code-window gap-0 py-0 overflow-hidden"
        >
          <Card.Header
            class="flex flex-row items-center gap-2 border-b px-4 py-2.5!"
          >
            <div class="flex items-center gap-1.5">
              <div
                class="h-2.5 w-2.5 rounded-full bg-muted-foreground/25"
              ></div>
              <div
                class="h-2.5 w-2.5 rounded-full bg-muted-foreground/25"
              ></div>
              <div
                class="h-2.5 w-2.5 rounded-full bg-muted-foreground/25"
              ></div>
            </div>
            <span class="ml-2 text-xs font-medium text-muted-foreground"
              >component.tiramisu</span
            >
            <Badge class="ml-auto">7 lines</Badge>
          </Card.Header>
          <Card.Content class="p-0">
            <pre class="overflow-x-auto p-5 text-[13px] leading-relaxed"><code
                ><span class="tk-fn">callout</span> <span class="tk-pn"
                  >&#123;</span
                > <span class="tk-attr">type</span> <span class="tk-pn">=</span
                > <span class="tk-str">warning</span><span class="tk-pn">,</span
                > <span class="tk-id"
                  >Don't forget to install the peer dependencies.</span
                > <span class="tk-pn">&#125;</span>

<span class="tk-fn">codetabs</span> <span class="tk-pn">&#123;</span>
  <span class="tk-attr">group</span> <span class="tk-pn">=</span> <span
                  class="tk-str">pkg</span
                ><span class="tk-pn">,</span>
  <span class="tk-fn">codetab</span> <span class="tk-pn">&#123;</span> <span
                  class="tk-attr">label</span
                > <span class="tk-pn">=</span> <span class="tk-str">npm</span
                ><span class="tk-pn">,</span> <span class="tk-attr"
                  >language</span
                > <span class="tk-pn">=</span> <span class="tk-str">bash</span
                ><span class="tk-pn">,</span> <span class="tk-id"
                  >npm install my-package</span
                > <span class="tk-pn">&#125;,</span>
  <span class="tk-fn">codetab</span> <span class="tk-pn">&#123;</span> <span
                  class="tk-attr">label</span
                > <span class="tk-pn">=</span> <span class="tk-str">yarn</span
                ><span class="tk-pn">,</span> <span class="tk-attr"
                  >language</span
                > <span class="tk-pn">=</span> <span class="tk-str">bash</span
                ><span class="tk-pn">,</span> <span class="tk-id"
                  >yarn add my-package</span
                > <span class="tk-pn">&#125;</span>
<span class="tk-pn">&#125;</span></code
              ></pre>
          </Card.Content>
        </Card.Root>
      </div>

      <div
        data-animate="fade-up"
        class="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3"
      >
        <Badge variant="secondary" class="gap-1.5 px-3 py-1.5 text-sm">
          <iconify-icon icon="lucide:check" width="14" height="14"
          ></iconify-icon>
          No imports — built-ins just work
        </Badge>
        <Badge variant="secondary" class="gap-1.5 px-3 py-1.5 text-sm">
          <iconify-icon icon="lucide:check" width="14" height="14"
          ></iconify-icon>
          No JSX — no angle brackets
        </Badge>
        <Badge variant="secondary" class="gap-1.5 px-3 py-1.5 text-sm">
          <iconify-icon icon="lucide:check" width="14" height="14"
          ></iconify-icon>
          No config — convention over configuration
        </Badge>
      </div>
    </div>
  </section>

  <!-- ==================== CTA FOOTER ==================== -->
  <section
    class="relative overflow-hidden bg-background px-4 sm:px-6 py-16 sm:py-24 lg:py-32"
  >
    <div data-animate="fade-up" class="mx-auto max-w-2xl text-center">
      <h2 class="text-2xl sm:text-3xl font-bold tracking-tight lg:text-4xl">
        Build your docs.
      </h2>
      <p class="mt-4 text-lg text-muted-foreground">
        Get started with Tiramisu Docs in minutes.
      </p>
      <div class="mt-8 flex justify-center gap-3">
        <Button href="/docs" size="lg">
          <iconify-icon icon="lucide:book-open" width="16" height="16"
          ></iconify-icon>
          Read the Docs
        </Button>
        <Button
          href="https://github.com/pouya-eghbali/tiramisu-docs"
          variant="secondary"
          size="lg"
          target="_blank"
          rel="noopener noreferrer"
        >
          <iconify-icon icon="mdi:github" width="18" height="18"></iconify-icon>
          Open GitHub
        </Button>
      </div>

      <!-- Powered by Tiramisu -->
      <div class="mt-16">
        <a
          href="/"
          class="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/50 transition-colors hover:text-muted-foreground"
        >
          <svg
            class="h-3 w-3"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
          >
            <rect
              x="3"
              y="16"
              width="18"
              height="3"
              rx="1"
              fill="currentColor"
              opacity="0.35"
            />
            <rect
              x="4"
              y="11"
              width="16"
              height="3"
              rx="1"
              fill="currentColor"
              opacity="0.6"
            />
            <rect
              x="5"
              y="6"
              width="14"
              height="3"
              rx="1"
              fill="currentColor"
              opacity="0.9"
            />
            <circle cx="8" cy="4" r="0.7" fill="currentColor" opacity="0.45" />
            <circle
              cx="12"
              cy="3.5"
              r="0.7"
              fill="currentColor"
              opacity="0.6"
            />
            <circle cx="16" cy="4" r="0.7" fill="currentColor" opacity="0.45" />
          </svg>
          Powered by Tiramisu
        </a>
      </div>
    </div>
  </section>
</div>

<SearchDialog bind:open={searchOpen} />

<style>
  .landing {
    color: var(--foreground);
  }

  .terminal-cursor {
    color: var(--muted-foreground);
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  /* Syntax token colors: light / dark */
  :global(.code-window .tk-kw) {
    color: #7c3aed;
  } /* keyword: violet */
  :global(.code-window .tk-fn) {
    color: #d97706;
  } /* function: amber */
  :global(.code-window .tk-tag) {
    color: #dc2626;
  } /* tag: red */
  :global(.code-window .tk-attr) {
    color: #0284c7;
  } /* attribute: sky */
  :global(.code-window .tk-str) {
    color: #16a34a;
  } /* string: green */
  :global(.code-window .tk-id) {
    color: #334155;
  } /* identifier: slate */
  :global(.code-window .tk-pn) {
    color: #94a3b8;
  } /* punctuation: slate-400 */
  :global(.code-window .tk-br) {
    color: #ca8a04;
  } /* brace: yellow */

  :global(.dark .code-window .tk-kw) {
    color: #a78bfa;
  }
  :global(.dark .code-window .tk-fn) {
    color: #fbbf24;
  }
  :global(.dark .code-window .tk-tag) {
    color: #fca5a5;
  }
  :global(.dark .code-window .tk-attr) {
    color: #7dd3fc;
  }
  :global(.dark .code-window .tk-str) {
    color: #86efac;
  }
  :global(.dark .code-window .tk-id) {
    color: #cbd5e1;
  }
  :global(.dark .code-window .tk-pn) {
    color: #64748b;
  }
  :global(.dark .code-window .tk-br) {
    color: #fde68a;
  }
</style>
