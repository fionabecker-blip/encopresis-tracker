import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import {
  loadThemePreference,
  saveThemePreference,
  type ThemePreference,
} from "../../app/utils/storage";
import { darkTheme, lightTheme, type Theme } from "./tokens";

type ThemeContextValue = {
  theme: Theme;
  /** What the user chose — "system" follows the OS. */
  preference: ThemePreference;
  setPreference: (value: ThemePreference) => void;
  /** Resolved scheme after applying the preference. */
  isDark: boolean;
};

// Defaulting to the light theme means a component rendered outside the
// provider still gets valid tokens instead of crashing on undefined.
const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  preference: "system",
  setPreference: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    let active = true;
    loadThemePreference().then((stored) => {
      if (active) setPreferenceState(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const setPreference = useCallback((value: ThemePreference) => {
    // Applied immediately; the write is fire-and-forget so the tap never waits
    // on disk. A failed write only costs the preference at next launch.
    setPreferenceState(value);
    saveThemePreference(value).catch(() => {});
  }, []);

  const isDark =
    preference === "system" ? systemScheme === "dark" : preference === "dark";

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: isDark ? darkTheme : lightTheme,
      preference,
      setPreference,
      isDark,
    }),
    [isDark, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The active theme tokens. */
export function useTheme(): Theme {
  return useContext(ThemeContext).theme;
}

/** Read and change the light/dark/system preference. */
export function useThemePreference() {
  const { preference, setPreference, isDark } = useContext(ThemeContext);
  return { preference, setPreference, isDark };
}
