/**
 * Design tokens — single source of truth for color, type, spacing, radius.
 * These are mirrored as CSS custom properties in tokens.css so components
 * can consume them via var(--token-name) without importing this file.
 *
 * Art direction: elevated luxury hospitality. Black/white/neutral gray
 * palette — the destination photograph carries environmental color, not
 * the interface. One restrained semantic red exists for Disruption, used
 * as an accent (a rule, a small mark) rather than a filled alert panel.
 * Helvetica Neue throughout; hierarchy comes from scale/weight/tracking,
 * not from a second typeface.
 */

export const color = {
  /** Customer-facing page background — pure white, per the "text over
   *  photography = white; text over surfaces = black" rule. */
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  ink: "#111111",
  /** Secondary customer-facing text — deliberately dark, reads as
   *  black rather than gray UI text. Not used for hairlines. */
  inkSecondary: "#3A3A3A",
  /** Reserved for hairlines and System Inspector's own dev-tool
   *  styling — never for customer-facing text color. */
  inkMuted: "#6B6B6B",
  border: "#E2E2E0",

  line: "#D8D8D5",

  // The one restrained semantic color, reserved for Disruption.
  recover: "#8A2A22",

  /** System Inspector's own surface — a very light neutral gray,
   *  deliberately distinct from the customer experience's pure white,
   *  so the drawer visually reads as separate tooling. Customer-facing
   *  components never use this token. */
  surfaceInspector: "#FAFAFA",
} as const;

export const font = {
  sans: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  mono: "'Helvetica Neue', Helvetica, Arial, sans-serif",
} as const;

export const space = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
  xxxl: "64px",
} as const;

export const radius = {
  sm: "2px",
} as const;

export type IntentTag = "prepare" | "recover" | "confirm";
