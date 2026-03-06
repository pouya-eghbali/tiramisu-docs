export interface TiramisuDocsConfig {
  title?: string
  description?: string
  logo?: string
  nav?: { label: string; href: string }[]
  sidebar?: {
    groupOrder?: string[]
  }
  theme?: {
    primary?: string
    radius?: string
  }
}

export interface ResolvedConfig {
  title: string
  description: string
  logo: string
  nav: { label: string; href: string }[]
  sidebar: { groupOrder: string[] }
  theme: { primary: string; radius: string }
}

export function defineConfig(config: TiramisuDocsConfig): TiramisuDocsConfig {
  return config
}

export function resolveConfig(config: TiramisuDocsConfig): ResolvedConfig {
  return {
    title: config.title ?? "Documentation",
    description: config.description ?? "",
    logo: config.logo ?? "",
    nav: config.nav ?? [],
    sidebar: {
      groupOrder: config.sidebar?.groupOrder ?? [],
    },
    theme: {
      primary: config.theme?.primary ?? "hsl(262, 83%, 58%)",
      radius: config.theme?.radius ?? "0.5rem",
    },
  }
}
