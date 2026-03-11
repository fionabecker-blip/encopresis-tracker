import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import SegmentedControl from "../components/SegmentedControl";
import { defaultSettings, loadSettings, saveSettings } from "../utils/storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const yesNoOptions = [
  { label: "On", value: "yes" },
  { label: "Off", value: "no" },
];

const waterOptions = [
  { label: "oz", value: "oz" },
  { label: "ml", value: "ml" },
];

const fiberOptions = [
  { label: "g", value: "g" },
  { label: "servings", value: "servings" },
];

export default function SettingsScreen() {
  const [settings, setSettings] = useState(defaultSettings);
  const [reminderToggle, setReminderToggle] = useState("no");
  const [reminderTime, setReminderTime] = useState("20:00");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadSettings().then((stored) => {
      setSettings(stored);
      setReminderToggle(stored.reminderEnabled ? "yes" : "no");
      setReminderTime(stored.reminderTime);
    });
  }, []);

  const formatList = (list) => (Array.isArray(list) ? list.join(", ") : "");

  const parseList = (value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const scheduleReminder = async (time) => {
    const [hourValue, minuteValue] = time.split(":");
    const hour = Number(hourValue);
    const minute = Number(minuteValue);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      throw new Error("invalid time");
    }
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status !== "granted") {
      const request = await Notifications.requestPermissionsAsync();
      if (request.status !== "granted") {
        throw new Error("permission denied");
      }
    }
    return Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily bowel log",
        body: "Record accidents, BMs, meds, hydration, and activity.",
      },
      trigger: { hour, minute, repeats: true },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus("");
    try {
      let notificationId = settings.notificationId ?? null;
      const reminderEnabled = reminderToggle === "yes";

      if (reminderEnabled) {
        if (notificationId) {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
        }
        notificationId = await scheduleReminder(reminderTime);
      } else if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        notificationId = null;
      }

      const updated = await saveSettings({
        childName: settings.childName,
        waterUnit: settings.waterUnit,
        fiberUnit: settings.fiberUnit,
        medAmountOptions: settings.medAmountOptions,
        reminderEnabled,
        reminderTime,
        notificationId,
      });
      setSettings(updated);
      setStatus("Settings saved.");
    } catch (error) {
      setStatus("Could not save settings. Check reminder time and permissions.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: "padding", android: undefined })}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Child profile</Text>
            <View style={styles.stack}>
              <Text style={styles.label}>Child name</Text>
              <TextInput
                value={settings.childName}
                onChangeText={(value) =>
                  setSettings((prev) => ({ ...prev, childName: value }))
                }
                placeholder="Child name"
                style={styles.input}
              />
            </View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Units</Text>
            <View style={styles.stack}>
              <Text style={styles.label}>Water unit</Text>
              <SegmentedControl
                options={waterOptions}
                value={settings.waterUnit}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, waterUnit: value }))
                }
              />
            </View>
            <View style={styles.stack}>
              <Text style={styles.label}>Fiber unit</Text>
              <SegmentedControl
                options={fiberOptions}
                value={settings.fiberUnit}
                onChange={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    fiberUnit: value,
                  }))
                }
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medication amounts</Text>
            <Text style={styles.helperText}>
              Enter comma-separated options.
            </Text>
            <View style={styles.stack}>
              <Text style={styles.label}>Miralax/Restorolax/PEG (caps)</Text>
              <TextInput
                value={formatList(settings.medAmountOptions?.miralaxCaps)}
                onChangeText={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    medAmountOptions: {
                      ...prev.medAmountOptions,
                      miralaxCaps: parseList(value),
                    },
                  }))
                }
                placeholder="1/2 cap, 1 cap, 2 caps"
                style={styles.input}
              />
            </View>
            <View style={styles.stack}>
              <Text style={styles.label}>Senna/Exlax (squares)</Text>
              <TextInput
                value={formatList(settings.medAmountOptions?.sennaSquares)}
                onChangeText={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    medAmountOptions: {
                      ...prev.medAmountOptions,
                      sennaSquares: parseList(value),
                    },
                  }))
                }
                placeholder="1 square, 2 squares, 3 squares"
                style={styles.input}
              />
            </View>
            <View style={styles.stack}>
              <Text style={styles.label}>Mag citrate (mg)</Text>
              <TextInput
                value={formatList(settings.medAmountOptions?.magCitrateMg)}
                onChangeText={(value) =>
                  setSettings((prev) => ({
                    ...prev,
                    medAmountOptions: {
                      ...prev.medAmountOptions,
                      magCitrateMg: parseList(value),
                    },
                  }))
                }
                placeholder="100 mg, 200 mg, 400 mg"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily reminder</Text>
            <View style={styles.stack}>
              <Text style={styles.label}>Enable reminder</Text>
              <SegmentedControl
                options={yesNoOptions}
                value={reminderToggle}
                onChange={setReminderToggle}
              />
            </View>
            <View style={styles.stack}>
              <Text style={styles.label}>Reminder time (24h)</Text>
              <TextInput
                value={reminderTime}
                onChangeText={setReminderTime}
                placeholder="20:00"
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Save settings</Text>
            )}
          </TouchableOpacity>

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 16,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  label: {
    fontSize: 14,
    color: "#475569",
  },
  helperText: {
    color: "#94A3B8",
    fontSize: 12,
  },
  stack: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F8FAFC",
    fontSize: 15,
    minHeight: 44,
  },
  button: {
    backgroundColor: "#4C6FFF",
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  status: {
    textAlign: "center",
    color: "#1E293B",
    fontWeight: "500",
  },
});