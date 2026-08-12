import { Stack } from "expo-router";
import { useTheme } from "../../src/theme/useTheme";

export default function LegalLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleStyle: { fontFamily: theme.fontFamily.sansSemiBold },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.textPrimary,
      }}
    />
  );
}
