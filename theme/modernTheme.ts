/**
 * GatherPoint-style UI tokens (ported).
 *
 * Note: We keep legacy token names (canvas/surface/pill/etc.) so the rest of the
 * app doesn’t need a huge refactor, while matching GatherPoint’s color scheme.
 */
export const colors = {
  // GatherPoint palette (primary blue)
  primary: "#1a6fd4",
  primaryDark: "#0d4fa8",
  primaryLight: "#dbeafe",
  primaryBg: "#f0f4ff",

  success: "#065f46",
  successBg: "#d1fae5",
  warning: "#92400e",
  warningBg: "#fef3c7",
  danger: "#c0392b",
  dangerBg: "#fff0f0",

  text: "#111111",
  textSecondary: "#666666",
  textTertiary: "#aaaaaa",

  background: "#ffffff",
  backgroundSecondary: "#f8faff",
  backgroundTertiary: "#f5f7fb",

  border: "#e0e8f4",
  borderLight: "#f0f0f0",

  white: "#ffffff",
  black: "#111111",

  // Legacy aliases used across the app
  canvas: "#ffffff",
  canvasAlt: "#f0f4ff",
  surface: "#ffffff",
  surfaceMuted: "#f8faff",

  // Accent aliases used by existing screens
  cyan: "#1a6fd4",
  cyanSoft: "#f0f4ff",
  mint: "#065f46",
  mintSoft: "#d1fae5",
  coral: "#c0392b",
  coralSoft: "#fff0f0",
  amber: "#92400e",
  error: "#c0392b",
  info: "#1a6fd4",
  textMuted: "#aaaaaa",
} as const

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
  pill: 999, // legacy alias
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

/** iOS-style card shadow + Android elevation */
export const shadowCard = {
  shadowColor: "#1a6fd4",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
} as const

export const shadowSoft = {
  shadowColor: "#1a6fd4",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 1,
} as const

export const shadowButton = {
  shadowColor: "#1a6fd4",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 2,
} as const

export const typography = {
  // GatherPoint types
  h1: { fontSize: 26, fontWeight: "700" as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: "700" as const, color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: "600" as const, color: colors.text },
  h4: { fontSize: 16, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 15, fontWeight: "400" as const, color: colors.text },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, color: colors.textSecondary },
  label: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  caption: { fontSize: 11, fontWeight: "400" as const, color: colors.textTertiary },

  // Legacy aliases used by existing screens
  hero: { fontSize: 26, fontWeight: "700" as const, letterSpacing: -0.5, color: colors.text },
  title: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.3, color: colors.text },
  subtitle: { fontSize: 16, fontWeight: "600" as const, color: colors.text },
  small: { fontSize: 12, fontWeight: "600" as const, color: colors.textSecondary, letterSpacing: 0.5 },
} as const
