/**
 * Tidepool design system — single source of truth.
 *
 * Nothing in the app should contain a hardcoded color, radius, spacing value,
 * or font name. Import from here instead.
 */

// ── Palette ──────────────────────────────────────────────────────────────────

const lightColors = {
  primary: "#1D6A64",
  primaryDark: "#14504B", // pressed states
  primaryTint: "#E3F0EC",
  // Cream rather than pure white: warmer against the teal primary and it keeps
  // button labels in the same family as the app background.
  onPrimary: "#FAF6EF",

  accent: "#E8A05C", // reward moments only — streaks, celebrations
  // Deep cocoa rather than black: keeps contrast on apricot without the label
  // reading as a warning.
  onAccent: "#5B3A16",

  background: "#FAF6EF",
  // Near-white, never pure white: reads as a clean card against the cream
  // background without the harsh edge of #FFFFFF.
  surface: "#FFFDF8",
  inputFill: "#FDFBF7",
  segmentTrack: "#EFE9DC",

  textPrimary: "#22333B",
  textSecondary: "#5F6B63",
  textMuted: "#8A857A",
  placeholder: "#B4AC9C",

  /** Label on an unselected segment — softer than textSecondary. */
  segmentText: "#6B7268",
  /** Label on an unselected chip — slightly lighter than textPrimary. */
  chipText: "#4A554D",

  border: "#DCD3C1",
  cardBorder: "#E9E1D2",
  divider: "#EDE5D6",

  danger: "#B0483E",
  dangerTint: "#F5DFDC",
  success: "#2F7D6E",
  successTint: "#DFF0E9",
  warning: "#C98A3C",
  warningTint: "#F7E9D5",
} as const;

/** Every theme must define the full palette; values are free-form colors. */
type Palette = Record<keyof typeof lightColors, string>;

const darkColors: Palette = {
  primary: "#4FA79E",
  primaryDark: "#3C8A82",
  primaryTint: "#1F3A36",
  onPrimary: "#0F1D1B",

  accent: "#E8A05C",
  onAccent: "#3A2409",

  background: "#15211F",
  surface: "#1C2B28",
  inputFill: "#16241F",
  segmentTrack: "#2C3D39",

  textPrimary: "#E5E1D4",
  textSecondary: "#8FA098",
  textMuted: "#6F7F78",
  placeholder: "#5E6E67",

  segmentText: "#95A69E",
  chipText: "#C9D3CD",

  border: "#2C3D39",
  cardBorder: "#2C3D39",
  divider: "#243330",

  danger: "#D4695E",
  dangerTint: "#3A211E",
  success: "#4FA79E",
  successTint: "#1F3A36",
  warning: "#D9A05F",
  warningTint: "#3A2E1D",
};

// ── Semantic data colors ─────────────────────────────────────────────────────
// Used for charts and the history heatmap. Accidents and leaks intentionally
// share one color: clinically they are two symptoms of the same problem and
// neither is "better" than the other.

const dataColors = (c: Palette) => ({
  /** Logged day, no accidents or leaks. */
  dayClear: c.success,
  /** Logged day with at least one accident or leak. */
  dayAccident: c.warning,
  /** Day with no entry at all. */
  dayUnlogged: c.divider,

  chart: {
    bm: c.primary,
    spontaneous: c.primary,
    enema: c.warning,
    accidents: c.danger,
    leaks: c.danger,
    activity: c.success,
  },

  /** Ordered palette for arbitrary chart series. */
  chartSeries: [c.primary, c.warning, c.danger, c.success] as string[],
});

// ── Illustration ─────────────────────────────────────────────────────────────
// Flat-color cartoon figure in ExerciseDemo. The figure is deliberately brand-
// colored rather than lifelike: a single teal body reads as a friendly mascot
// and sidesteps having to pick a skin tone for every family using the app.
// Depth comes from three tiers only — near, far, and extremities.

const illustration = (c: Palette) => ({
  /** Torso, head, and near-side limbs. */
  body: c.primary,
  /** Limbs on the far side of the body, pushed back a step. */
  limbFar: c.primaryDark,
  /** Hands and feet — the apricot accent, so the pose reads at a glance. */
  extremity: c.accent,
  /** Thin separator drawn around every shape so overlaps stay legible. */
  outline: c.surface,

  /** Tinted panel the figure performs on. */
  stage: c.primaryTint,
  /** Floor the figure stands on. */
  groundLine: "#BFD8D0",
  /** Contact shadow pooled under the feet. */
  groundShadow: "rgba(29, 106, 100, 0.18)",
});

// ── Radii ────────────────────────────────────────────────────────────────────

export const radii = {
  input: 12,
  segmentThumb: 11,
  segmentTrack: 14,
  /** Action button inside a modal — a touch tighter than a screen CTA. */
  modalAction: 14,
  button: 16,
  /** Illustration stage inside a modal. */
  stage: 18,
  card: 20,
  modal: 24,
  chip: 999,
} as const;

// ── Spacing (4pt grid) ───────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,

  gutter: 20,
  cardPad: 18,
  cardGap: 16,
  sectionGap: 12,
} as const;

// ── Typography ───────────────────────────────────────────────────────────────

export const fontFamily = {
  serif: "Lora_600SemiBold",
  sans: "PublicSans_400Regular",
  sansMedium: "PublicSans_500Medium",
  sansSemiBold: "PublicSans_600SemiBold",
  sansBold: "PublicSans_700Bold",
} as const;

export const typography = {
  screenTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 28,
    lineHeight: 34,
  },
  sectionTitle: {
    fontFamily: fontFamily.serif,
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    fontFamily: fontFamily.sansBold,
    fontSize: 17,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  /** Label inside a segmented control — heavier than `label` so the selected
   *  segment reads clearly against the primary fill. */
  segmentLabel: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  /** Label on an unselected chip. Selected chips switch to `chipLabelSelected`. */
  chipLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 18,
  },
  chipLabelSelected: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
  },
  /** Tab bar label. The selected tab steps up a weight rather than a size, so
   *  the bar never reflows as you move between tabs. */
  tabLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 11,
    lineHeight: 14,
  },
  tabLabelActive: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
  },
  /** Digit inside a numbered step bubble. */
  cueNumber: {
    fontFamily: fontFamily.sansBold,
    fontSize: 12,
  },
  /** Small uppercase brand eyebrow sitting above a screen title. */
  kicker: {
    fontFamily: fontFamily.sansSemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.6,
  },
} as const;

// ── Control sizing ───────────────────────────────────────────────────────────

export const sizing = {
  /** Primary call-to-action height. */
  ctaHeight: 54,
  /** Minimum tappable dimension (accessibility floor). */
  minTouch: 44,
  /** Border width on text inputs, thicker than a hairline so focus reads. */
  inputBorderWidth: 1.5,
  hairline: 1,

  /** Overall height of a segmented control, track included. */
  segmentHeight: 46,
  /** Inset between the track edge and the segments. */
  segmentPad: 4,
  /** Gap between adjacent segments. */
  segmentGap: 4,

  chipPadV: 9,
  chipPadH: 14,
  /** Chips carry the same 1.5px stroke as inputs. */
  chipBorderWidth: 1.5,

  /** Diameter of the inline ⓘ affordance. */
  infoIcon: 16,
  infoIconBorderWidth: 1.5,

  tabIcon: 24,
  /**
   * Stroke weight for every line icon. Lucide draws on a 24px grid, so this
   * reads as intended at `tabIcon` size and gets optically heavy below ~16px.
   */
  iconStroke: 2,
  /** Numbered step bubble in a modal's instruction list. */
  cueCircle: 22,
} as const;

/** Duration of the segmented-control thumb slide. */
export const durations = {
  segmentThumb: 180,
} as const;

// ── Elevation ────────────────────────────────────────────────────────────────
// Only the primary call-to-action is raised. Cards are deliberately flat and
// rely on their border for separation.

const shadows = (c: Palette) => ({
  cta: {
    shadowColor: c.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    // iOS reads the shadow* props; Android only reads elevation.
    elevation: 6,
  },
  /** The moving thumb in a segmented control — a hair of lift, not a drop. */
  segmentThumb: {
    shadowColor: c.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  none: {
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
  },
});

// ── Themes ───────────────────────────────────────────────────────────────────

export const lightTheme = {
  // Widened to Palette so the light and dark themes share one type.
  colors: lightColors as Palette,
  data: dataColors(lightColors),
  shadows: shadows(lightColors),
  illustration: illustration(lightColors),
  radii,
  spacing,
  sizing,
  typography,
  fontFamily,
  durations,
} as const;

export type Theme = typeof lightTheme;

export const darkTheme: Theme = {
  ...lightTheme,
  colors: darkColors,
  data: dataColors(darkColors),
  shadows: shadows(darkColors),
  illustration: illustration(darkColors),
};

export type ThemeColors = Palette;

/**
 * Default export is the light theme. Screens that do not yet subscribe to the
 * color scheme import this directly; `useTheme()` returns the scheme-aware one.
 */
export const tokens = lightTheme;

export default tokens;
