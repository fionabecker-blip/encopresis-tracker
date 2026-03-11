import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const createIcon = (name) => ({ color, size }) => (
  <Ionicons name={name} size={size} color={color} />
);

const logIcon = createIcon("create-outline");
const historyIcon = createIcon("calendar-outline");
const settingsIcon = createIcon("settings-outline");
const progressIcon = createIcon("stats-chart-outline");
const resourcesIcon = createIcon("book-outline");

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#4C6FFF",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: { paddingTop: 6 },
        headerTitleStyle: { fontWeight: "600" },
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