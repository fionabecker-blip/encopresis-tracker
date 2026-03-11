import AsyncStorage from "@react-native-async-storage/async-storage";
const SETTINGS_KEY = "bm_settings";

export const defaultSettings = {
  childName: "",
  waterUnit: "oz",
  fiberUnit: "g",
  reminderEnabled: false,
  reminderTime: "20:00",
  notificationId: null,
};

export async function loadSettings() {
  const value = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!value) {
    return defaultSettings;
  }
  try {
    return { ...defaultSettings, ...JSON.parse(value) };
  } catch (error) {
    return defaultSettings;
  }
}

export async function saveSettings(update) {
  const current = await loadSettings();
  const next = { ...current, ...update };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export default function StorageRoute() {
  return null;
}