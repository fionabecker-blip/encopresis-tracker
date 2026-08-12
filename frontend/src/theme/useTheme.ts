/**
 * Re-exported from the provider so the many `useTheme` call sites across the
 * app keep their existing import path. The theme now comes from context rather
 * than reading `useColorScheme` directly, so a manual override in Settings
 * reaches every screen.
 */
export { useTheme, useThemePreference } from "./ThemeProvider";
export { useTheme as default } from "./ThemeProvider";
