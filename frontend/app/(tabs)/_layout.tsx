import { Tabs } from "expo-router";
import { Text } from "react-native";
import Icon, { type IconName } from "../../src/components/Icon";
import { useTheme } from "../../src/theme/useTheme";
import type { Theme } from "../../src/theme/tokens";

const createIcon =
  (name: IconName) =>
  ({ color }: { color: string }) =>
    <Icon name={name} color={color} />;

const logIcon = createIcon("log");
const historyIcon = createIcon("history");
const settingsIcon = createIcon("settings");
const progressIcon = createIcon("progress");
const resourcesIcon = createIcon("resources");

// The selected tab steps from medium to semibold. React Navigation applies one
// `tabBarLabelStyle` to every state, so the label is rendered by hand to get a
// focus-dependent weight.
const createLabel =
  (t: Theme) =>
  ({ focused, color, children }: { focused: boolean; color: string; children: string }) =>
    (
      <Text
        numberOfLines={1}
        style={[focused ? t.typography.tabLabelActive : t.typography.tabLabel, { color }]}
      >
        {children}
      </Text>
    );

export default function TabsLayout() {
  const theme = useTheme();
  const tabBarLabel = createLabel(theme);

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabel,
        tabBarStyle: {
          paddingTop: theme.spacing.xs,
          backgroundColor: theme.colors.surface,
          borderTopWidth: theme.sizing.hairline,
          borderTopColor: theme.colors.divider,
          // The bar sits flush against the content; separation is the border's
          // job, so the platform's default lift is removed on both sides.
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: {
          ...theme.typography.sectionTitle,
          color: theme.colors.textPrimary,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Daily Log",
          tabBarIcon: logIcon,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: historyIcon,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: progressIcon,
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          title: "Resources",
          tabBarIcon: resourcesIcon,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: settingsIcon,
        }}
      />
    </Tabs>
  );
}
