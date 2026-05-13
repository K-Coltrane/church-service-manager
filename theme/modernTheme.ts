/**
 * Balance Church UI tokens — white & blue palette (splash-aligned).
 */
export const colors = {
  primary: "#1a6fd4",
  primaryDark: "#0d4fa8",
  primaryMid: "#1565c0",
  primaryLight: "#dbeafe",
  primaryBg: "#f0f4ff",
  primaryMuted: "#e8eef8",

  success: "#0d4fa8",
  successBg: "#dbeafe",
  warning: "#1a6fd4",
  warningBg: "#f0f4ff",
  danger: "#0d4fa8",
  dangerBg: "#f0f4ff",

  text: "#0f172a",
  textSecondary: "#5c6b82",
  textTertiary: "#94a3b8",

  background: "#ffffff",
  backgroundSecondary: "#f8faff",
  backgroundTertiary: "#f0f4ff",

  border: "#dce4f0",
  borderLight: "#eef2f8",

  white: "#ffffff",
  black: "#0f172a",

  canvas: "#ffffff",
  canvasAlt: "#f0f4ff",
  surface: "#ffffff",
  surfaceMuted: "#f8faff",

  cyan: "#1a6fd4",
  cyanSoft: "#f0f4ff",
  mint: "#0d4fa8",
  mintSoft: "#dbeafe",
  coral: "#0d4fa8",
  coralSoft: "#f0f4ff",
  amber: "#1a6fd4",
  error: "#0d4fa8",
  info: "#1a6fd4",
  textMuted: "#94a3b8",
} as const

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
  pill: 999,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const

export const shadowCard = {
  shadowColor: "#0d4fa8",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 3,
} as const

export const shadowSoft = {
  shadowColor: "#0d4fa8",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
} as const

export const shadowButton = {
  shadowColor: "#0d4fa8",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.12,
  shadowRadius: 8,
  elevation: 3,
} as const

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, color: colors.text, letterSpacing: -0.6 },
  h2: { fontSize: 22, fontWeight: "700" as const, color: colors.text, letterSpacing: -0.4 },
  h3: { fontSize: 18, fontWeight: "600" as const, color: colors.text, letterSpacing: -0.2 },
  h4: { fontSize: 16, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.text, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, color: colors.textSecondary, lineHeight: 19 },
  label: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  caption: { fontSize: 12, fontWeight: "400" as const, color: colors.textTertiary },

  hero: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.6, color: colors.text },
  title: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.3, color: colors.text },
  subtitle: { fontSize: 16, fontWeight: "600" as const, color: colors.text },
  small: { fontSize: 11, fontWeight: "600" as const, color: colors.textSecondary, letterSpacing: 0.6 },
} as const
