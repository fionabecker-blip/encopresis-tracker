# Google Play listing — The Encopresis Tracker

Draft for Play Console. Every feature claim below was verified against source on 2026-11-01.
Deliberately omits any named third-party protocol or clinical guideline.

Build to upload: `1.0.2` / versionCode `2` (AAB)
`https://expo.dev/artifacts/eas/M40vbAdkNcE4Enrr0DxKk9YobF0i1V5SAa6KsBz88QQ.aab`

---

## App name (30 char max)

```
The Encopresis Tracker
```

22 characters. On-device name stays "Enco Tracker" — that is set in `frontend/app.json` and is a separate thing from this field.

---

## Short description (80 char max)

```
Track accidents, stools, meds and timed sits. Export a report for your doctor.
```

77 characters.

---

## Full description (4000 char max)

```
Encopresis and chronic constipation recovery is slow, and the day-to-day detail is impossible to hold in your head. This app keeps that record for you, then turns it into something your child's doctor can actually use.

Built by a parent who needed it.

WHAT IT TRACKS
Soiling and fecal incontinence, wetting accidents, constipation, stool withholding, and the medication routine that goes with them. Fecal and urine accidents are counted separately, so encopresis and enuresis show up as distinct patterns rather than one combined "accidents" number. Wetting is counted per day; the app does not separate night from day.

FITS THE ROUTINE YOU'RE ALREADY ON
If your family follows the M.O.P. method, the daily fields line up with it — cleanout days, daily maintenance medication and dose, timed sits, Bristol type, and separate accident and leak counts all have a place to go. The same fields work just as well for a plan your own pediatrician gave you.

This is an independent tracking tool. It is not affiliated with, endorsed by, or sponsored by M.O.P., its author, or any other clinical program.

DAILY LOG
Log a day in under a minute:
• Fecal and urine accidents, and leaks and smears, counted separately
• Bowel movement type — spontaneous, suppository-induced, or none
• Bristol stool scale, types 1 to 7, each with a plain-language description
• Water, by the glass, up to 12
• Fiber, in grams or servings
• Medications and dose, including Miralax/Restorolax/PEG, Senna/Ex-Lax and magnesium citrate — with your own dose amounts, or add your own medications
• Motility foods — kiwi, pears, avocado, olive oil, warm liquids, dragon fruit, papaya and apples, each with a note on why it helps
• Timed sits, and whether sitting position was correct
• Abdominal pain
• Withholding behavior
• 30+ minutes of physical activity, including bear hold, crab walk and froggy jumps, each with a short animated demo
• Cleanout days, with notes
• Free-form notes for anything else

HISTORY
Every entry in one list, with a calendar that colors each day at a glance — green for accident-free, amber for a day with an accident or leak, plain for days you didn't log. Patterns you'd never spot entry by entry become obvious. Export everything to CSV or PDF.

PROGRESS, AND A REPORT FOR YOUR PEDIATRICIAN
One tap produces a PDF covering the last 30 days:
• Total bowel movements and total accidents
• Current accident-free streak, and the longest one in the period
• Medication adherence
• Days timed sits were completed
• Average days between stools
• Patterns worth raising with your doctor, such as whether this period's accidents tended to follow longer gaps between stools
• Charts for accidents per week, bowel movements per week, and the trend in days between stools

Take it to the appointment instead of trying to remember. On-screen: daily charts, a view comparing outcomes across medications, week-by-week summaries, and separate streaks for accident-free days, logging and timed sits.

It also offers quiet encouragement based on what you've logged, and reminds you that recovery usually takes months.

REMINDERS
A daily nudge to log, plus up to three timed-sit reminders at times you choose.

YOUR DATA STAYS ON YOUR PHONE
There is no account, no sign-up, and no server. Entries are encrypted and stored on your device only, with the encryption key held in the device keystore and never included in backups. No analytics. No tracking. No ads. Nothing is transmitted anywhere. Reports leave your phone only when you choose to share one.

ALSO
Set your child's name, pick light or dark theme, choose your units, and save your own medications and foods. A short guide explains each field, with links to pediatric education material.

This app is a tracking and informational tool. It does not provide medical advice, diagnosis, or treatment, and is not affiliated with any program or linked material. Always consult a qualified healthcare professional about your child's care.
```

### Rules for the M.O.P. mention

The "FITS THE ROUTINE YOU'RE ALREADY ON" block names M.O.P. as a **compatibility claim only** — the "works with Nespresso" pattern (nominative fair use). It is factually grounded: the med picker ships "Multi-Mop" and "MOP x" options in `frontend/app/(tabs)/index.tsx` lines 58-66.

Three constraints, none optional:

1. **Full description only.** Never the app name, short description, or tags — Play's metadata policy is strictest about third-party brand terms in the high-ranking fields.
2. **Disclaimer stays adjacent to the claim**, not moved down to the closing paragraph. Separating them removes the thing that makes the claim safe.
3. **Never** "official", "endorsed", "approved", "certified", "partner"; no logo or lookalike styling. Always keep the sentence saying the fields work equally for a pediatrician's own plan — that framing is what keeps "friendly" reading as compatibility rather than relationship.

Trademark status of "M.O.P." has not been verified and should not be asserted either way; the pattern above is the safe one regardless. If a reviewer objects this is a metadata edit — no rebuild, no new AAB.

Still **do not** cite clinical guidelines (Rome IV, NASPGHAN, etc.). Naming a guideline implies a validation the app would have to defend — a different claim from compatibility, with no fair-use cover.

---

## Required Play Console fields

| Field | Value |
|---|---|
| App category | Medical (Health & Fitness is the alternative; Medical is the better fit and has a smaller, less competitive field) |
| Tags | **Medical** + **Parenting** (2 of a possible 5) |
| Email | theencopresistracker@gmail.com |
| Privacy policy URL | https://fionabecker-blip.github.io/encopresis-tracker/privacy.html |
| Website (optional) | https://fionabecker-blip.github.io/encopresis-tracker/support.html |
| Contains ads | **No** |
| In-app purchases | **No** |

### Tags — why only two

Read off Play's actual fixed list on 2026-11-01. The taxonomy is narrow: there is no "symptom tracker", "health tracking", "personal health records" or "caregiving" tag, so the obvious candidates don't exist.

- **Medical** — standalone tag with no parent category. Exact match, consistent with the chosen category.
- **Parenting** — a parent logging about a child. Accurate, and it is the shelf a searching parent browses.

**Deliberately not selected:**

- **Activity tracker** — was auto-selected by default and removed. The page warns that tags affect "the peer groups you're compared against"; Activity tracker sits under Health & fitness, so the app would be benchmarked on install/retention against step counters and fitness trackers. It also reassociates the app with the Health & fitness category that was deliberately passed over. The app's physical-activity field is a logging checkbox plus three exercise demos, not activity tracking.
- **Health & fitness** — broadest reach, but drags the peer group back toward fitness apps for no real gain.
- **Baby care** — Parenting-adjacent but wrong age; encopresis is diagnosed in school-age children.
- **Self-help**, **Education**, **Books & reference** — the Resources tab is one screen, not the product.

Don't fill all five slots for the sake of it. Irrelevant tags dilute the peer group without adding discovery.

### Target audience — answer this one carefully

Select **18 and over only**, and answer **No** to "Is your app designed primarily for children?"

The app is used *by a parent about a child*. It is not a children's app. Saying otherwise pulls you into Google Play's Families Policy, which adds a separate design review, restricts what you can link out to, and would put your external YouTube and hospital links under extra scrutiny. There is no benefit to opting in.

### Data safety form

The honest answers here are unusually clean, because nothing leaves the device:

- Does your app collect or share any required user data types? → **No**
- Is all user data encrypted in transit? → N/A, nothing is transmitted
- Do you provide a way for users to request data deletion? → Data is local; uninstalling removes it

That "No data collected" badge on your listing is a genuine selling point for a health app about a child. Worth leaning on.

### Health apps declaration

Required of every app on Play, including ones with no health features. Six categories apply, each checked against Google's published definition and a real feature in the source:

| Category | Maps to |
|---|---|
| Activity and Fitness | `activity_types`, `activity_30_min` |
| Nutrition and Weight Management | water (0–12 stepper), fiber, motility foods |
| Diseases and Conditions Management | the core purpose — encopresis/constipation tracking |
| Medication and Treatment Management | med picker with doses, adherence % in the PDF, timed-sit reminders |
| Physical Therapy and Rehabilitation | cued exercise demos in `app/components/ExerciseDemo.tsx` (reps, hold times, pelvic-floor rationale) |
| Medical Reference and Education | the Resources tab |

**Deliberately NOT selected:**

- **Medical Device Apps** — only for regulated apps. Selecting it triggers EU MDR disclosure duties (UDI-DI, Single Registration Number, notified body certificate, eIFU link). None apply.
- **Clinical Decision Support** — defined as tools for *healthcare professionals* using algorithm-driven insights. The pediatrician PDF does surface a detected pattern ("accidents occur when stool interval exceeds 3 days"), which is the closest call on the form, but the app is built for parents and that line describes logged data rather than recommending treatment. Expect a reviewer to probe this one.
- **Mental and Behavioral Health** — the app tracks *withholding behavior*, an observable physical behavior, not an emotional state. Checking it would pull a non-mental-health field into mental-health policy scope.
- Period tracking, Sleep, Stress/mental acuity, Disease prevention, Emergency, Healthcare services, Reproductive health, Human subjects research, Other.

### Content rating questionnaire

Answer it honestly and it should come back Everyone. There is no violence, no user-generated content, no social features, no location, no purchases. The one question that gives people pause is whether the app references drugs — it lists over-the-counter laxatives in a medical context, which is what the questionnaire's medical-context exception is for.

---

## Graphics checklist

| Asset | Spec | Status |
|---|---|---|
| App icon | 512×512 PNG | **Ready** — `store-assets/android/icon-512.png`, from `assets/images/icon.png` (teal mark on cream). Decided 2026-11-01 to keep teal rather than the navy variant, so the store icon matches the launcher icon already compiled into the AAB |
| Feature graphic | 1024×500 PNG | **Ready** — `store-assets/android/feature-graphic-1024x500.png`. Built from the transparent `adaptive-icon.png` on the app's cream `#FAF6EF`. Regenerate with `python3 store-assets/android/make-feature-graphic.py` |
| Phone screenshots | 2–8 required, 16:9 or 9:16, 320–3840px | **Needed.** Pixel 9 screenshots are 1080×2424, which is valid — take them straight off the phone |

### Screenshot plan for the Pixel 9

Play needs a minimum of two. Take four, in this order — it reads as a story without needing long-term data:

1. **Daily Log** — the entry form, partly filled in. Shows the breadth of what's tracked.
2. **History calendar** — the color-coded month. Even a partial month communicates the idea.
3. **Progress** — any chart on screen.
4. **The pediatrician PDF** — open an exported report and screenshot it. This is the strongest frame you have.

You mentioned not having screenshots that show progress over time. That is fine and does not block submission — none of the four above depend on a long history, and Play has no requirement that screenshots demonstrate longitudinal data. Log a handful of varied days first so the calendar and charts are not empty, then shoot.
