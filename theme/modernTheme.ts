/**
 * Modern “lively” UI tokens — vibrant accents, soft surfaces, depth.
 */
export const colors = {
  /** Page background */
  canvas: "#eef2ff",
  canvasAlt: "#e0e7ff",
  /** Cards & sheets */
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  /** Brand — nav bars, primary actions, former blue/purple UI */
  primary: "#0e172b",
  /** Lighter tint for glows / subtle accents on dark surfaces */
  primaryLight: "#1e3a5f",
  /** Same as primary (headers); use primaryLight for depth if needed */
  primaryDark: "#0e172b",
  /** Accent pops */
  cyan: "#06b6d4",
  cyanSoft: "#cffafe",
  mint: "#10b981",
  mintSoft: "#d1fae5",
  coral: "#fb7185",
  coralSoft: "#ffe4e6",
  amber: "#f59e0b",
  /** Text */
  text: "#0f172a",
  textSecondary: "#475569",
  textMuted: "#94a3b8",
  /** Lines */
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  /** Status */
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#0e172b",
} as const

export const radii = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
} as const

/** iOS-style card shadow + Android elevation */
export const shadowCard = {
  shadowColor: "#0e172b",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 6,
} as const

export const shadowSoft = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 3,
} as const

export const shadowButton = {
  shadowColor: "#0e172b",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.35,
  shadowRadius: 8,
  elevation: 5,
} as const

export const typography = {
  hero: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5 },
  title: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.3 },
  subtitle: { fontSize: 16, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "500" as const },
  caption: { fontSize: 13, fontWeight: "500" as const },
  small: { fontSize: 12, fontWeight: "600" as const },
} as const
