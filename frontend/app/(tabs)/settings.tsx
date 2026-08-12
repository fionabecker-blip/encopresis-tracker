import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import SegmentedControl from "../components/SegmentedControl";
import Card from "../../src/components/Card";
import PrimaryButton from "../../src/components/PrimaryButton";
import ScreenHeader from "../../src/components/ScreenHeader";
import TextField from "../../src/components/TextField";
import {
  defaultSettings,
  loadSettings,
  saveSettings,
  type ThemePreference,
} from "../utils/storage";
import { useTheme, useThemePreference } from "../../src/theme/useTheme";
import type { Theme } from "../../src/theme/tokens";

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

const themeOptions = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const SIT_TITLE = "Sit time";
const SIT_BODY = "Sit break in a few minutes";
const NUDGE_TITLE = "Daily log";
const NUDGE_BODY = "Quick log for today?";

const isValidTime = (value: string) => /^\d{2}:\d{2}$/.test(value)
  && Number(value.split(":")[0]) < 24
  && Number(value.split(":")[1]) < 60;

export default function SettingsScreen() {
  const [settings, setSettings] = useState(defaultSettings);
  const [sitReminders, setSitReminders] = useState(defaultSettings.timedSitReminders);
  const [nudgeEnabled, setNudgeEnabled] = useState("no");
  const [nudgeTime, setNudgeTime] = useState("20:00");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  useEffect(() => {
    loadSettings().then((stored) => {
      setSettings(stored);
      setSitReminders(stored.timedSitReminders ?? defaultSettings.timedSitReminders);
      setNudgeEnabled(stored.dailyLogNudgeEnabled ? "yes" : "no");
      setNudgeTime(stored.dailyLogNudgeTime ?? "20:00");
    });
  }, []);

  const formatList = (list) => (Array.isArray(list) ? list.join(", ") : "");

  const parseList = (value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const ensurePermission = async () => {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status !== "granted") {
      const request = await Notifications.requestPermissionsAsync();
      if (request.status !== "granted") {
        throw new Error("permission denied");
      }
    }
  };

  const scheduleAt = async (time, title, body) => {
    if (!isValidTime(time)) throw new Error("invalid time");
    const [hourValue, minuteValue] = time.split(":");
    return Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { hour: Number(hourValue), minute: Number(minuteValue), repeats: true },
    });
  };

  const cancelIfExists = async (id) => {
    if (id) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch {
        // ignore — notification may already be gone
      }
    }
  };

  const updateSitReminder = (index, patch) => {
    setSitReminders((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus("");
    try {
      const needsPermission =
        nudgeEnabled === "yes" || sitReminders.some((s) => s.enabled);
      if (needsPermission) await ensurePermission();

      // Cancel and re-schedule the daily log nudge
      await cancelIfExists(settings.dailyLogNudgeNotificationId);
      const nextNudgeId =
        nudgeEnabled === "yes" ? await scheduleAt(nudgeTime, NUDGE_TITLE, NUDGE_BODY) : null;

      // Cancel and re-schedule each timed sit reminder
      const nextSitReminders = await Promise.all(
        sitReminders.map(async (slot, i) => {
          await cancelIfExists(settings.timedSitReminders?.[i]?.notificationId);
          if (!slot.enabled) {
            return { ...slot, notificationId: null };
          }
          const id = await scheduleAt(slot.time, SIT_TITLE, SIT_BODY);
          return { ...slot, notificationId: id };
        })
      );

      const updated = await saveSettings({
        childName: settings.childName,
        waterUnit: settings.waterUnit,
        fiberUnit: settings.fiberUnit,
        medAmountOptions: settings.medAmountOptions,
        customMeds: (settings.customMeds ?? [])
          .map((m) => m.trim())
          .filter(Boolean),
        customFoods: (settings.customFoods ?? [])
          .map((f) => f.trim())
          .filter(Boolean),
        dailyLogNudgeEnabled: nudgeEnabled === "yes",
        dailyLogNudgeTime: nudgeTime,
        dailyLogNudgeNotificationId: nextNudgeId,
        timedSitReminders: nextSitReminders,
      });
      setSettings(updated);
      setSitReminders(updated.timedSitReminders);
      setStatus("Settings saved.");
    } catch (error) {
      setStatus("Could not save settings. Check reminder times and permissions.");
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
          <ScreenHeader title="Settings" />
          <Card title="Child profile">
            <TextField
              label="Child name"
              value={settings.childName}
              onChangeText={(value) =>
                setSettings((prev) => ({ ...prev, childName: value }))
              }
              placeholder="Child name"
            />
          </Card>
          <Card title="Appearance">
            <View style={styles.stack}>
              <Text style={styles.label}>Theme</Text>
              <SegmentedControl
                options={themeOptions}
                value={preference}
                onChange={(value) => setPreference(value as ThemePreference)}
              />
              <Text style={styles.helperText}>
                Applies straight away — no need to save.
              </Text>
            </View>
          </Card>
          <Card title="Units">
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
          </Card>

          <Card title="Medication amounts">
            <Text style={styles.helperText}>
              Enter comma-separated options.
            </Text>
            <TextField
              label="Miralax/Restorolax/PEG (caps)"
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
            />
            <TextField
              label="Senna/Exlax (squares)"
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
            />
            <TextField
              label="Mag citrate (mg)"
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
            />
          </Card>

          <Card title="Custom medications">
            <Text style={styles.helperText}>
              Add medications or protocols not in the built-in list. These appear as chips on the
              Daily Log. For one-off entries, use the &ldquo;Other&hellip;&rdquo; chip on the Daily Log instead.
            </Text>
            {(settings.customMeds ?? []).map((name, index) => (
              <View key={`custom-${index}`} style={styles.customMedRow}>
                <View style={styles.flex1}>
                  <TextField
                    value={name}
                    onChangeText={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        customMeds: (prev.customMeds ?? []).map((item, i) =>
                          i === index ? value : item
                        ),
                      }))
                    }
                    placeholder="Med name"
                  />
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setSettings((prev) => ({
                      ...prev,
                      customMeds: (prev.customMeds ?? []).filter((_, i) => i !== index),
                    }))
                  }
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() =>
                setSettings((prev) => ({
                  ...prev,
                  customMeds: [...(prev.customMeds ?? []), ""],
                }))
              }
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+ Add medication</Text>
            </TouchableOpacity>
          </Card>

          <Card title="Custom foods">
            <Text style={styles.helperText}>
              Add motility foods not in the built-in list. These appear as chips in the
              Hydration and diet section of the Daily Log. For one-off entries, use the
              &ldquo;Other&hellip;&rdquo; chip on the Daily Log instead.
            </Text>
            {(settings.customFoods ?? []).map((name, index) => (
              <View key={`custom-food-${index}`} style={styles.customMedRow}>
                <View style={styles.flex1}>
                  <TextField
                    value={name}
                    onChangeText={(value) =>
                      setSettings((prev) => ({
                        ...prev,
                        customFoods: (prev.customFoods ?? []).map((item, i) =>
                          i === index ? value : item
                        ),
                      }))
                    }
                    placeholder="Food name"
                  />
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setSettings((prev) => ({
                      ...prev,
                      customFoods: (prev.customFoods ?? []).filter((_, i) => i !== index),
                    }))
                  }
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() =>
                setSettings((prev) => ({
                  ...prev,
                  customFoods: [...(prev.customFoods ?? []), ""],
                }))
              }
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>+ Add food</Text>
            </TouchableOpacity>
          </Card>

          <Card title="Timed sit reminders">
            <Text style={styles.helperText}>
              Set up to 3 daily reminders. About 20 minutes after meals (breakfast, lunch, or
              dinner) is a good time to sit, since the gastrocolic reflex makes BMs more likely.
            </Text>
            <Text style={styles.helperText}>
              Notification reads &ldquo;{SIT_TITLE}&rdquo; on the lock screen.
            </Text>
            {sitReminders.map((slot, index) => (
              <View key={`sit-${index}`} style={styles.reminderRow}>
                <Text style={styles.label}>Reminder {index + 1}</Text>
                <View style={styles.reminderControls}>
                  <View style={styles.reminderToggle}>
                    <SegmentedControl
                      options={yesNoOptions}
                      value={slot.enabled ? "yes" : "no"}
                      onChange={(value) =>
                        updateSitReminder(index, { enabled: value === "yes" })
                      }
                    />
                  </View>
                  <TextField
                    value={slot.time}
                    onChangeText={(value) => updateSitReminder(index, { time: value })}
                    placeholder="07:30"
                    style={styles.timeInput}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}
          </Card>

          <Card title="Daily log reminder">
            <Text style={styles.helperText}>
              Optional evening nudge. Notification reads &ldquo;{NUDGE_TITLE}&rdquo; on the lock screen.
            </Text>
            <View style={styles.stack}>
              <Text style={styles.label}>Enable reminder</Text>
              <SegmentedControl
                options={yesNoOptions}
                value={nudgeEnabled}
                onChange={setNudgeEnabled}
              />
            </View>
            <TextField
              label="Reminder time (24h)"
              value={nudgeTime}
              onChangeText={setNudgeTime}
              placeholder="20:00"
              autoCapitalize="none"
            />
          </Card>

          <Card title="Legal">
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => router.push("/legal/medical-disclaimer")}
            >
              <Text style={styles.linkText}>Medical Disclaimer</Text>
              <Text style={styles.linkArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => router.push("/legal/terms")}
            >
              <Text style={styles.linkText}>Terms of Use</Text>
              <Text style={styles.linkArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => router.push("/legal/privacy")}
            >
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Text style={styles.linkArrow}>›</Text>
            </TouchableOpacity>
          </Card>

          <Card title="Support">
            <Text style={styles.bodyText}>
              This app is a tracking and informational tool only and does not diagnose
              or treat medical conditions.
            </Text>
            <Text style={styles.bodyText}>
              Entries are stored on this device only and are not sent to any server.
            </Text>
            <Text style={styles.bodyText}>Contact: seafaress@protonmail.com</Text>
          </Card>

          <PrimaryButton title="Save settings" onPress={handleSave} loading={saving} />

          {status ? <Text style={styles.status}>{status}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: t.colors.background,
    },
    flex: {
      flex: 1,
    },
    container: {
      padding: t.spacing.gutter,
      gap: t.spacing.cardGap,
    },
    label: {
      ...t.typography.label,
      color: t.colors.textSecondary,
    },
    helperText: {
      ...t.typography.caption,
      color: t.colors.textMuted,
    },
    linkRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: t.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.divider,
    },
    linkText: {
      ...t.typography.body,
      color: t.colors.textPrimary,
    },
    linkArrow: {
      color: t.colors.textMuted,
      fontSize: 18,
    },
    bodyText: {
      ...t.typography.body,
      color: t.colors.textSecondary,
    },
    stack: {
      gap: t.spacing.sm,
    },
    status: {
      ...t.typography.label,
      textAlign: "center",
      color: t.colors.textPrimary,
    },
    reminderRow: {
      gap: t.spacing.sm,
    },
    reminderControls: {
      flexDirection: "row",
      gap: t.spacing.md,
      alignItems: "center",
    },
    reminderToggle: {
      flex: 1,
    },
    timeInput: {
      width: 90,
      textAlign: "center",
    },
    customMedRow: {
      flexDirection: "row",
      gap: t.spacing.sm,
      alignItems: "center",
    },
    flex1: {
      flex: 1,
    },
    removeButton: {
      paddingHorizontal: t.spacing.md,
      paddingVertical: t.spacing.md,
      borderRadius: t.radii.input,
      backgroundColor: t.colors.dangerTint,
      minHeight: 44,
      justifyContent: "center",
    },
    removeButtonText: {
      ...t.typography.label,
      color: t.colors.danger,
    },
    addButton: {
      paddingVertical: t.spacing.md,
      borderRadius: t.radii.input,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderStyle: "dashed",
      backgroundColor: t.colors.inputFill,
      alignItems: "center",
      minHeight: 44,
      justifyContent: "center",
    },
    addButtonText: {
      ...t.typography.label,
      color: t.colors.primary,
    },
  });