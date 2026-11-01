# Known issues — fix before/with the next build (1.0.3)

**Current shipped version: 1.0.2** (`frontend/app.json`). The AAB in Play closed testing is built from 1.0.2.

> **REMINDER: these require a new build.** Bump `version` in `frontend/app.json`, run `eas build -p android --profile production`, and upload the new AAB. None of these are fixed by editing store copy.
>
> Best window to do this is **during the 14-day closed-testing period**, so it doesn't delay the tester clock. Do not rebuild before the closed-testing release is live — that clock is the critical path to production.

All three issues are in the pediatrician-report pattern detection, `frontend/app/(tabs)/progress.tsx` lines 604-631.

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
