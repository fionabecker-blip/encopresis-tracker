import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MMKV } from "react-native-mmkv";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import type { Entry } from "../types";

const SETTINGS_KEY = "bm_settings";
const ENTRIES_KEY = "bm_entries";
const THEME_KEY = "theme_preference";

// ── Encrypted storage (H1) ───────────────────────────────────────────────────
// Health data is stored in an MMKV instance encrypted with a random key that
// lives in the hardware-backed Keychain/Keystore (SecureStore). The key is
// marked WHEN_UNLOCKED_THIS_DEVICE_ONLY, so it is never included in device
// backups — backed-up ciphertext is unreadable without it.

const DB_KEY_NAME = "gutcheck_db_key";
const MIGRATION_FLAG = "migrated_from_asyncstorage_v1";

const BASE64_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Encode 12 random bytes as 16 base64 chars (~96 bits of entropy).
// MMKV encryption keys are limited to 16 bytes.
function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1] ?? 0;
    const b2 = bytes[i + 2] ?? 0;
    out +=
      BASE64_ALPHABET[b0 >> 2] +
      BASE64_ALPHABET[((b0 & 3) << 4) | (b1 >> 4)] +
      BASE64_ALPHABET[((b1 & 15) << 2) | (b2 >> 6)] +
      BASE64_ALPHABET[b2 & 63];
  }
  return out;
}

async function getOrCreateEncryptionKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(DB_KEY_NAME);
  if (!key) {
    const bytes = await Crypto.getRandomBytesAsync(12);
    key = toBase64(bytes);
    await SecureStore.setItemAsync(DB_KEY_NAME, key, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  return key;
}

async function createStorage(): Promise<MMKV> {
  const instance =
    Platform.OS === "web"
      ? // SecureStore/encryption are unavailable on web; MMKV falls back to
        // localStorage there. The published mobile apps always encrypt.
        new MMKV({ id: "gutcheck" })
      : new MMKV({
          id: "gutcheck",
          encryptionKey: await getOrCreateEncryptionKey(),
        });

  // One-time migration of existing data out of plaintext AsyncStorage.
  if (!instance.getBoolean(MIGRATION_FLAG)) {
    try {
      for (const key of [SETTINGS_KEY, ENTRIES_KEY]) {
        const value = await AsyncStorage.getItem(key);
        if (value != null && instance.getString(key) == null) {
          instance.set(key, value);
        }
      }
      await AsyncStorage.multiRemove([SETTINGS_KEY, ENTRIES_KEY]);
      instance.set(MIGRATION_FLAG, true);
    } catch {
      // If migration fails we retry on next launch; AsyncStorage data is
      // only removed after a successful copy.
    }
  }
  return instance;
}

let storagePromise: Promise<MMKV> | null = null;

function getStorage(): Promise<MMKV> {
  if (!storagePromise) {
    storagePromise = createStorage();
  }
  return storagePromise;
}

// ── Settings ─────────────────────────────────────────────────────────────────

// Detect locale-appropriate default water unit
const getDefaultWaterUnit = () => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return locale === "en-US" ? "oz" : "ml";
  } catch {
    return "oz";
  }
};

export const defaultSettings = {
  childName: "",
  waterUnit: getDefaultWaterUnit(),
  fiberUnit: "g",
  medAmountOptions: {
    miralaxCaps: ["1/2 cap", "1 cap", "2 caps"],
    sennaSquares: ["1 square", "2 squares", "3 squares", "4 squares"],
    magCitrateMg: ["100 mg", "200 mg", "400 mg"],
  },
  customMeds: [] as string[],
  customFoods: [] as string[],
  // Daily log nudge (replaces old reminderEnabled / reminderTime)
  dailyLogNudgeEnabled: false,
  dailyLogNudgeTime: "20:00",
  dailyLogNudgeNotificationId: null as string | null,
  // Timed sit reminders (3 configurable slots)
  timedSitReminders: [
    { enabled: false, time: "07:30", notificationId: null as string | null },
    { enabled: false, time: "12:00", notificationId: null as string | null },
    { enabled: false, time: "18:00", notificationId: null as string | null },
  ],
};

export type Settings = typeof defaultSettings;

export async function loadSettings(): Promise<Settings> {
  const storage = await getStorage();
  const value = storage.getString(SETTINGS_KEY);
  if (!value) {
    return defaultSettings;
  }
  try {
    const stored = JSON.parse(value);

    // Migration: move old reminderEnabled/reminderTime into new shape
    if ("reminderEnabled" in stored && !("dailyLogNudgeEnabled" in stored)) {
      stored.dailyLogNudgeEnabled = stored.reminderEnabled;
      stored.dailyLogNudgeTime = stored.reminderTime ?? "20:00";
      stored.dailyLogNudgeNotificationId = stored.notificationId ?? null;
      delete stored.reminderEnabled;
      delete stored.reminderTime;
      delete stored.notificationId;
    }

    return { ...defaultSettings, ...stored };
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(update: Partial<Settings>): Promise<Settings> {
  const storage = await getStorage();
  const current = await loadSettings();
  const next = { ...current, ...update };
  storage.set(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

// ── Appearance ───────────────────────────────────────────────────────────────
// Kept out of `Settings` deliberately: the theme applies the instant it is
// tapped, whereas everything in `Settings` is staged until "Save settings".

export type ThemePreference = "system" | "light" | "dark";

export async function loadThemePreference(): Promise<ThemePreference> {
  const storage = await getStorage();
  const value = storage.getString(THEME_KEY);
  return value === "light" || value === "dark" ? value : "system";
}

export async function saveThemePreference(value: ThemePreference): Promise<void> {
  const storage = await getStorage();
  storage.set(THEME_KEY, value);
}

// ── Entry migration ─────────────────────────────────────────────────────────
// Converts legacy leaks (boolean) + leak_type ("urine"|"fecal"|"both") to
// the flat numeric fields fecal_leaks / urine_leaks.  Old fields are kept in
// storage for backup — we just layer the new shape on top at read time.

function migrateEntry(raw: Record<string, unknown>): Entry {
  if (!("leaks" in raw)) return raw as Entry;

  const entry = { ...raw } as Record<string, unknown>;
  if (raw.leaks === true) {
    const lt = raw.leak_type as string | undefined;
    if (lt === "fecal" || lt === "both")
      entry.fecal_leaks = ((entry.fecal_leaks as number) || 0) + 1;
    if (lt === "urine" || lt === "both")
      entry.urine_leaks = ((entry.urine_leaks as number) || 0) + 1;
    if (!lt) // leaks=true with no type — default to fecal
      entry.fecal_leaks = ((entry.fecal_leaks as number) || 0) + 1;
  }
  return entry as Entry;
}

// ── Entry storage ────────────────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export async function loadEntries(): Promise<Entry[]> {
  const storage = await getStorage();
  const value = storage.getString(ENTRIES_KEY);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(migrateEntry) : [];
  } catch {
    return [];
  }
}

export async function saveEntry(entry: Entry): Promise<void> {
  const storage = await getStorage();
  const entries = await loadEntries();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.unshift(entry); // newest first
  }
  storage.set(ENTRIES_KEY, JSON.stringify(entries));
}

export async function deleteEntry(id: string): Promise<void> {
  const storage = await getStorage();
  const entries = await loadEntries();
  const filtered = entries.filter((e) => e.id !== id);
  storage.set(ENTRIES_KEY, JSON.stringify(filtered));
}

export default function StorageRoute() {
  return null;
}
