# Gut Check / Enco Tracker — Pre-Launch Security Audit
**Date:** July 6, 2026 · **Scope:** full repo (`frontend/`, `backend/`, git history, dependencies) · **Auditor:** Claude

---

## TL;DR

The good news: the app is genuinely local-only — no analytics SDKs, no crash reporters, no network calls in any live code path, and no real secrets in source or git history. The two things that actually matter before TestFlight: **(1)** all child health data sits in **plaintext AsyncStorage** that gets synced into **iCloud/Google backups by default**, and **(2)** the repo still ships the entire dead MongoDB backend plus dead API client code, which contradicts your "local-only" privacy story and bloats your attack/review surface.

---

## CRITICAL

*None.* Nothing here is exploitable remotely, and no live secrets were found.

---

## HIGH

### H1 — Child health data stored in plaintext AsyncStorage
**Location:** `frontend/app/utils/storage.ts` (entire file; keys `bm_settings`, `bm_entries`)

**Risk:** AsyncStorage is **not encrypted**. On iOS it's a plain file under the app's `Documents/RCTAsyncLocalStorage`; on Android it's an unencrypted SQLite file in app-private storage. Anyone with a device backup, a jailbroken/rooted device, or forensic tooling can read every entry — child's name, medications, accidents, notes — as raw JSON.

**Fix (recommended pattern — data is too large for SecureStore alone):**
1. `npx expo install react-native-mmkv expo-secure-store`
2. Generate a random 256-bit key once, store it in SecureStore (hardware-backed Keychain/Keystore), and use it as the MMKV encryption key:

```ts
// storage.ts
import { MMKV } from "react-native-mmkv";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

async function getOrCreateKey(): Promise<string> {
  let key = await SecureStore.getItemAsync("db_key");
  if (!key) {
    key = Buffer.from(Crypto.getRandomValues(new Uint8Array(32))).toString("base64");
    await SecureStore.setItemAsync("db_key", key, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }
  return key;
}

export const storage = new MMKV({ id: "gutcheck", encryptionKey: await getOrCreateKey() });
```
3. Write a one-time migration: read `bm_settings`/`bm_entries` from AsyncStorage → write to encrypted MMKV → `AsyncStorage.multiRemove([...])`.
4. Alternative if you prefer SQL: `expo-sqlite` with SQLCipher (`op-sqlite` supports it), key in SecureStore. MMKV is the simpler drop-in for your current JSON-blob pattern.

> Note: adding encryption uses OS-standard crypto, so `ITSAppUsesNonExemptEncryption: false` in `app.json` remains valid.

### H2 — Health data flows into iCloud / Google cloud backups by default
**Location:** `frontend/app.json` — no backup exclusions configured.

**Risk:** iOS backs up the Documents/Application Support dirs (where AsyncStorage lives) to iCloud; Android's `allowBackup` defaults to true, so the AsyncStorage DB goes to Google's cloud backup. Your privacy policy will say "data never leaves the device" — but Apple's and Google's servers would hold a copy. For children's health data this is a real mismatch.

**Fix:**
- **Android:** in `app.json` → `"android": { "allowBackup": false, ... }` (Expo supports this key directly).
- **iOS:** either accept encrypted-at-rest data being backed up (defensible once H1 is fixed, since the SecureStore key uses `THIS_DEVICE_ONLY` and does NOT get backed up — backed-up ciphertext is unreadable), or additionally mark files with `expo-file-system`'s `isBackedUp: false` / `NSURLIsExcludedFromBackupKey` for exported files.
- Fixing H1 with a `WHEN_UNLOCKED_THIS_DEVICE_ONLY` key largely neutralizes this finding on iOS — that's why H1 comes first.

---

## MEDIUM

### M1 — Dead MongoDB backend and API client still in the codebase
**Locations:** `backend/server.py`, `backend/requirements.txt`, `backend_test.py`, `test_result.md`, `frontend/app/utils/api.ts`, `frontend/app.config.ts` (injects `EXPO_PUBLIC_BACKEND_URL`).

**Risk:** No live code imports `api.ts` (verified — zero references to `apiGet`/`apiSend`/`API_BASE` outside the file), so nothing phones home today. But: it's one accidental import away from re-enabling network sync with **zero auth and no TLS pinning** (`server.py` has no authentication at all and wide-open CORS); it confuses any future security review; and `app.config.ts` still wires a backend URL into the built app config. Historical `.env` files in git history contain only `mongodb://localhost:27017` and dead Emergent preview URLs — no real credentials — so history rewriting is *not* required.

**Fix:** Delete `backend/`, `backend_test.py`, `frontend/app/utils/api.ts`, and strip the `EXPO_PUBLIC_BACKEND_URL` block from `app.config.ts` (or delete `app.config.ts` entirely — `app.json` covers everything else). Remove `@expo/ngrok`, `react-native-dotenv`, and `react-native-webview` from `package.json` (all unused).

### M2 — No app-level lock (biometric/passcode) on a family-shared device
**Location:** app-wide; no `expo-local-authentication` present.

**Risk:** This app will often live on a shared iPad or a parent's phone handed to kids. Anyone who unlocks the device sees the child's full bowel-health history. Also worth remembering the *child themselves* may find it embarrassing if a sibling or friend opens it.

**Fix:** `npx expo install expo-local-authentication`; gate the root layout:

```tsx
// app/_layout.tsx
const [unlocked, setUnlocked] = useState(false);
useEffect(() => {
  LocalAuthentication.authenticateAsync({ promptMessage: "Unlock Gut Check" })
    .then(r => setUnlocked(r.success));
}, []);
if (!unlocked) return <LockScreen onRetry={...} />;
```
Make it an opt-in toggle in Settings (default ON is defensible here). Re-lock on `AppState` → background.

### M3 — Exported CSV/PDF files persist unencrypted in the app sandbox and are backed up
**Location:** `frontend/app/(tabs)/history.tsx` `handleExportCsv` (~line 525) and PDF export (~line 708); same pattern in `progress.tsx`.

**Risk:** `FileSystem.writeAsStringAsync(documentDirectory + fileName)` then `Sharing.shareAsync(...)` — the file is **never deleted**. Plaintext health-data files accumulate in Documents (iCloud-backed on iOS) even after H1 is fixed.

**Fix:** Write exports to `FileSystem.cacheDirectory` instead of `documentDirectory`, and `await FileSystem.deleteAsync(fileUri, { idempotent: true })` in a `finally` block after `shareAsync` resolves.

### M4 — Unescaped user input interpolated into export HTML (PDF) and CSV formula injection
**Locations:** `history.tsx` `buildHtml()` (~lines 587–700: `${entry.notes}`, `${entry.bm_notes}`, `${entry.clean_out_notes}`, `${childName}` interpolated raw); `buildCsv()` (~line 512: quotes escaped, but not leading `=`, `+`, `-`, `@`).

**Risk:** Notes containing `<`, `>` or HTML break or alter the pediatrician PDF (rendered in a WebView by `expo-print`); a note starting with `=` becomes a live formula when the CSV is opened in Excel/Sheets (classic CSV-injection — could exfiltrate data on the *recipient's* machine). Threat actor is "whoever types notes," so severity is moderate, but the fix is 10 minutes.

**Fix:**
```ts
const esc = (v: unknown) =>
  String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
// use <td>${esc(entry.notes)}</td> etc., and esc(childName) in summaryHtml

// CSV: neutralize formulas
const cell = String(v ?? "");
const safe = /^[=+\-@\t\r]/.test(cell) ? "'" + cell : cell;
return `"${safe.replace(/"/g, '""')}"`;
```

---

## LOW

### L1 — Vulnerable transitive dependencies (all build-time, none ship in the app binary)
`yarn audit`: 13 findings — **1 High** (undici WebSocket DoS, via Expo CLI), 10 Moderate (postcss XSS in stringifier, undici header injection, js-yaml DoS, uuid bounds check), 2 Low. All live in Expo/RN **dev tooling**, not in runtime app code — practical risk to users ≈ nil. **Fix:** add a `resolutions` block (`"undici": ">=6.27.0", "postcss": ">=8.5.10"`) or just take the next Expo SDK patch release before final store submission. No abandoned or suspicious packages found in your direct dependencies.

### L2 — Child's name embedded in export filenames
**Location:** `buildExportFilename(childName, ...)` in `history.tsx`/`progress.tsx`. The shared file's *name* (visible in AirDrop, email subject lines, Files app, recents) contains the child's name + implied condition ("encopresis"/"bowel log"). **Fix:** default filename to something neutral (`gut-check-report-2026-07-06.pdf`) with an option to include the name.

### L3 — Repo hygiene: build cache and junk committed
`frontend/.metro-cache/**` (hundreds of files) and `.DS_Store` are committed. Scanned the cache — no secrets baked in, but it inflates the repo and could someday capture env values. **Fix:** `git rm -r --cached frontend/.metro-cache **/.DS_Store` and add `.metro-cache/` to `frontend/.gitignore`.

### L4 — Invalid Info.plist key
`app.json` → `NSUserNotificationUsageDescription` is not a real iOS key (local notifications need no usage-description string). Harmless, but remove it to avoid App Review confusion. Permissions overall are exemplary: Android requests only `POST_NOTIFICATIONS`. ✅

### L5 — Input validation is minimal (accepted risk)
Numeric fields use `keyboardType="numeric"` but values aren't clamped/parsed defensively; no `maxLength` on notes. With local-only storage and no SQL (no SQLite in use → **no injection surface**), this is a data-quality issue more than security. Fix opportunistically (clamp counts to 0–99, `maxLength={2000}` on notes).

---

## Compliance check (COPPA / PIPEDA / stores)

- **COPPA:** applies to online collection of personal info *from children* by an operator. Your app collects nothing off-device and the *parent* is the user — so with M1 removed (dead backend gone) you're in a strong position. Do **not** market the app as "for kids" in store listings (keeps you outside "child-directed" classification); state in the privacy policy that all data stays on-device and no data is collected by you.
- **PIPEDA:** because you (the developer) never receive personal information, most obligations don't attach — but your policy must still be accurate.
- **Privacy policy mismatch (fix the text):** `frontend/app/legal/privacy.tsx` says data is local *"unless cloud syncing is enabled"* — **no cloud sync exists**. Delete that clause; it invites App Review questions and implies collection you don't do. Also add: what's stored, that OS backups may copy data (or that you've disabled backup — see H2), no third-party analytics, contact email, and how to delete data (delete the app / a "clear all data" button — worth adding).
- **Store declarations:** Apple Privacy Nutrition Label → "Data Not Collected" (only true after M1 cleanup); Google Play Data Safety → "No data collected or shared." Health-adjacent apps get extra reviewer scrutiny — the medical disclaimer screen you already have helps. ✅
- **Verified clean:** no analytics SDKs, no crash reporters, no Sentry/Firebase, zero `console.log` of health data anywhere in `frontend/app`. Expo's dev telemetry does not ship in production builds.

---

## Top 3 before TestFlight

1. **H1 — Encrypt data at rest** (MMKV + SecureStore key, with AsyncStorage migration). This is the headline fix for children's health data.
2. **H2 — Disable Android `allowBackup` + use a `THIS_DEVICE_ONLY` key** so cloud backups can't leak plaintext.
3. **M1 — Delete the dead backend, `api.ts`, and backend-URL config** so the code matches the "100% local, nothing collected" privacy policy you'll file with Apple and Google.

(M4's escaping fix is ~10 minutes — worth folding into the same PR.)
