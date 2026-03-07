export interface LogoConfig {
  light: string
  dark: string
}

export interface SectionConfig {
  label: string
  path?: string
  href?: string
  children?: SectionConfig[]
}

export interface LocaleConfig {
  code: string
  label: string
  flag?: string
}

export interface I18nConfig {
  defaultLocale: string
  locales: LocaleConfig[]
  fallback?: "default-language" | "404"
}

export interface ResolvedI18nConfig {
  defaultLocale: string
  locales: LocaleConfig[]
  fallback: "default-language" | "404"
}

export interface TiramisuDocsConfig {
  title?: string
  description?: string
  logo?: string | LogoConfig
  nav?: { label: string; href: string }[]
  sidebar?: {
    groupOrder?: string[]
  }
  sections?: SectionConfig[]
  i18n?: I18nConfig
  theme?: {
    primary?: string
    radius?: string
  }
}

export interface ResolvedConfig {
  title: string
  description: string
  logo: LogoConfig
  nav: { label: string; href: string }[]
  sections?: SectionConfig[]
  i18n?: ResolvedI18nConfig
  sidebar: { groupOrder: string[] }
  theme: { primary: string; radius: string }
}

export function defineConfig(config: TiramisuDocsConfig): TiramisuDocsConfig {
  return config
}

function resolveLogo(logo?: string | LogoConfig): LogoConfig {
  if (!logo) return { light: "", dark: "" }
  if (typeof logo === "string") return { light: logo, dark: logo }
  return logo
}

export function resolveConfig(config: TiramisuDocsConfig): ResolvedConfig {
  return {
    title: config.title ?? "Documentation",
    description: config.description ?? "",
    logo: resolveLogo(config.logo),
    nav: config.nav ?? [],
    sections: config.sections,
    i18n: config.i18n ? {
      defaultLocale: config.i18n.defaultLocale,
      locales: config.i18n.locales,
      fallback: config.i18n.fallback ?? "default-language",
    } : undefined,
    sidebar: {
      groupOrder: config.sidebar?.groupOrder ?? [],
    },
    theme: {
      primary: config.theme?.primary ?? "hsl(262, 83%, 58%)",
      radius: config.theme?.radius ?? "0.5rem",
    },
  }
}
