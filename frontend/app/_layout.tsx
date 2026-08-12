import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { Lora_600SemiBold } from "@expo-google-fonts/lora";
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from "@expo-google-fonts/public-sans";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DisclaimerScreen from "../components/DisclaimerScreen";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { useTheme, useThemePreference } from "../src/theme/useTheme";

const DISCLAIMER_KEY = "disclaimerAccepted";

// Hold the native splash until fonts and the disclaimer flag resolve, so the
// first frame never renders in a fallback typeface.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore: the splash may already be hidden during fast refresh.
});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootView />
    </ThemeProvider>
  );
}

/** Split from RootLayout so it can consume the theme context above it. */
function RootView() {
  const theme = useTheme();
  const { isDark } = useThemePreference();
  const [accepted, setAccepted] = useState(false);
  const [flagLoaded, setFlagLoaded] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Lora_600SemiBold,
    PublicSans_400Regular,
    PublicSans_500Medium,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
  });

  useEffect(() => {
    AsyncStorage.getItem(DISCLAIMER_KEY).then((value) => {
      setAccepted(value === "true");
      setFlagLoaded(true);
    });
  }, []);

  // A font loading failure should not strand the user on the splash screen.
  const ready = flagLoaded && (fontsLoaded || Boolean(fontError));

  const onLayoutRootView = useCallback(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  const handleAccept = async () => {
    await AsyncStorage.setItem(DISCLAIMER_KEY, "true");
    setAccepted(true);
  };

  if (!ready) {
    return null;
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      onLayout={onLayoutRootView}
    >
      {/* Without this the status bar glyphs stay dark and vanish against the
          dark background. */}
      <StatusBar style={isDark ? "light" : "dark"} />
      {accepted ? (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="legal" options={{ headerShown: false }} />
        </Stack>
      ) : (
        <DisclaimerScreen onAccept={handleAccept} />
      )}
    </View>
  );
}
