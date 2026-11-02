# Known issues — fix before/with the next build

**Version in `frontend/app.json`: 1.0.3.** `versionCode` is not in this file — `frontend/eas.json` sets `appVersionSource: "remote"` with `autoIncrement` on the production profile, so EAS stamps it.

> **REMINDER: these require a new build.** Bump `version` in `frontend/app.json`, run `eas build -p android --profile production`, and upload the new AAB. None of these are fixed by editing store copy.

**Plan changed 2026-11-01.** The earlier plan was to ship 1.0.2 to closed testing and patch during the 14-day window. Reversed once issue 0 was found: 1.0.3 is being built *before* the first closed-testing release.

**Why:** the 14 days runs on 12 testers staying opted in, and pushing a newer AAB to the same track mid-window doesn't restart it — so "patch later" bought almost nothing. Meanwhile 1.0.2 would have shown all 12 testers an app that looks like it lost their data on day one. Recruiting the testers is the real bottleneck, not the 20-minute build.

Issue 0 is a data-visibility bug affecting History and Progress. Issues 1-3 are in the pediatrician-report pattern detection, `frontend/app/(tabs)/progress.tsx` lines 604-631.

---

## 0. FIXED in 1.0.3 — History and Progress never refreshed; the app looked like it lost your data

**Fixed 2026-11-01, not yet verified on a device.** Confirm before trusting it: log a day, switch tabs to History *without* force-quitting, and check the day appears.

Found 2026-11-01 while logging demo days for store screenshots. Entries saved correctly and the "Saved for \<date\>" toast fired, but History kept showing a months-old snapshot. The data was never lost — the screen simply never read storage again.

`frontend/app/(tabs)/history.tsx` lines 116-135:

```js
const fetchEntries = useCallback(async () => { ... }, []);  // stable identity
useEffect(() => { fetchEntries(); }, [fetchEntries]);        // therefore runs ONCE
```

The dependency array on `useCallback` is empty, so `fetchEntries` keeps the same identity for the life of the component, so the effect never re-fires. Expo Router keeps tab screens mounted after first visit, so the list is read exactly once per app launch. `frontend/app/(tabs)/progress.tsx` lines 255-258 have the identical pattern.

At the time of the report, `useFocusEffect` appeared zero times anywhere in `frontend/app/(tabs)/`.

Severity was high and not cosmetic. The core loop of the app is *log a day, then look at it*. A parent logs an entry, opens History, sees nothing, and concludes the app threw their data away. For a tracking app whose entire pitch is "keeps the record for you", that is the worst possible first impression — and it generates one-star reviews that read as data loss even though nothing is lost.

Workaround on 1.0.2: force-quit and reopen the app.

**What shipped:** reload on focus rather than on mount, in all three tabs.

```js
import { useFocusEffect } from "expo-router";
useFocusEffect(useCallback(() => { fetchEntries(); }, [fetchEntries]));
```

- `history.tsx` — entry list reloads on focus
- `progress.tsx` — charts, streaks and the exported PDF reload on focus
- `index.tsx` — `loadSettings` moved to focus, so custom meds and foods added in Settings appear as chips without a relaunch

**Do not collapse this to `useFocusEffect(fetchEntries)`.** `fetchEntries` is `async`, so it returns a Promise, and `useFocusEffect` treats any returned value as its cleanup function — its declared type is `() => undefined | void | (() => void)`. The `useCallback` wrapper that discards the return value is load-bearing, not style.

### 0a. STILL OPEN — the Daily Log is write-only

**Not fixed in 1.0.3.** Picking a date that already has an entry shows a blank form — nothing loads the existing entry for the selected date. Combined with issue 0 this is what made the data look missing. Worth considering whether selecting a date should load that day's entry for editing.

### 0b. STILL OPEN — saving the same date twice creates a duplicate

**Not fixed in 1.0.3,** and now easier to hit: with issue 0 fixed, users can actually see their entries, so they are more likely to go back to a date and re-save it.

`saveEntry` matches on `entry.id`, and `handleSubmit` calls `generateId()` fresh every time, so the id never matches an existing row and the entry is appended rather than replaced. Two entries for one date both count toward accident totals and both render in History. Should match on `date`, or load-and-update when the date already exists.

These two are related and should be fixed together: loading the existing entry on date-select (0a) naturally gives `handleSubmit` an existing `id` to reuse, which fixes 0b.

---

## 1. PRIORITY — Pattern detection is blind to overflow incontinence

**This is the most important one.**

The only pattern the report can detect is "accidents followed long gaps between stools":

```js
if (diffDays > 3) accidentsWhenLongInterval += 1;
...
if (accidentsObserved && accidentsWhenLongInterval / accidentsObserved >= 0.5) {
  patterns.push("Accidents occur when stool interval exceeds 3 days.");
}
```

A child can pass stool **every single day** and still soil constantly — that is overflow incontinence leaking around a retained mass, and it is the textbook encopresis presentation. For that child `diffDays` is never more than 1, the numerator stays at 0, the pattern never fires, and the report prints:

> "No strong patterns detected yet. Keep logging for clearer trends."

So the most common presentation of the condition the app is built for produces a blank report telling the parent to keep logging. That is the opposite of useful, and it's the case where a parent most needs something concrete to show a doctor.

**Fix:** add the counterpart pattern — frequent accidents *despite* short stool intervals, which suggests incomplete evacuation / impaction. Signals already available in the data model:

- high accident-day rate while median interval is <= 1-2 days
- Bristol types 1-2 (hard/pellet) recurring alongside daily BMs
- `withholding_behavior` logged often while BMs are frequent
- small/frequent BMs combined with `abdominal_pain`

Phrase it as an observation to raise with the doctor, never as a diagnosis — see issue 2.

---

## 2. Pattern wording is stated as an absolute

Current string:

> "Accidents occur when stool interval exceeds 3 days."

Reads as a general law. What it actually means is: *over this 30-day window, at least half of this child's accident days fell more than 3 days after a recorded bowel movement.*

Two problems: a pediatrician reading a flat causal assertion will discount the rest of the report, and a parent may read it as a diagnosis. For a Play health app this also edges into clinical-inference phrasing, which gets more scrutiny.

**Fix:** make it observational and bounded to the window and the child. Something like:

> "In this period, 7 of 11 accident days came more than 3 days after a bowel movement. Worth raising with your doctor."

Showing the actual counts also lets a clinician judge the strength of the signal instead of trusting a threshold they can't see.

---

## 3. Logging gaps can manufacture the pattern

`lastStoolDate` only advances on days that have an entry recording a BM:

```js
const entry = entryMap.get(key);
const bmType = entry ? normalizeBmType(entry.bm_type) : "";
if (bmType.includes("sp") || bmType.includes("enema")) lastStoolDate = date;
```

Miss a week of logging, then log an accident, and `diffDays` evaluates to 8 even if the child passed stool every one of those unlogged days. The pattern can fire on a vacation rather than on constipation.

**Fix:** don't count an accident day toward the numerator when there are unlogged days between it and `lastStoolDate`. Either skip those days, or track "days since last *logged* stool" separately from "days since last *known* stool" and only apply the >3 test when the intervening days were actually logged.

### Related minor asymmetry

`accidentsObserved += 1` runs unconditionally, but the `diffDays` test requires `lastStoolDate` to be non-null. Accidents occurring before the first recorded BM in the window therefore inflate the denominator and can never contribute to the numerator, biasing the ratio downward. Harmless direction (makes the pattern fire less often) but it should be consistent — exclude those days from both, or from neither.

---

## Store copy implications (no build needed)

`STORE-LISTING-ANDROID.md` describes this feature. Until issues 1-2 are fixed the description must stay observational:

> • Patterns worth raising with your doctor, such as whether this period's accidents tended to follow longer gaps between stools

Do **not** restore wording that implies the app detects a cause, and do not claim it detects overflow incontinence until issue 1 actually ships.
