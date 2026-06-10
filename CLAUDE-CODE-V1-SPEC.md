# Encopresis Tracker — v1 Polish Spec for Claude Code

## Context

This is a mobile app (Expo / React Native, exported from Emergent) that helps parents of children with encopresis/chronic constipation track daily bowel routines, medications, timed sits, hydration, and accidents. It exports CSV/PDF reports for pediatric clinicians.

Built by a parent of a child in recovery. The core flows work. This spec is a focused polish pass to make it publishable — **not** a rebuild.

## Before you start

1. Explore the codebase first. Map the screens (Daily Log, History, Progress, Resources, Settings), the data model, and how entries are stored before changing anything.  
2. Identify whether data is stored locally (AsyncStorage/SQLite) or on a backend. Report what you find before making changes — local-first is the goal for privacy reasons.  
3. Check for any hardcoded API keys, URLs with credentials, or secrets in the source. Flag anything found.

## Guardrails

- Do NOT break the CSV export or change its column structure without flagging it — clinicians may rely on the format.  
- Do NOT add accounts, login, or cloud sync in this pass.  
- Do NOT redesign the visual style. Keep the existing clean clinical look.  
- Keep all existing fields and data intact — migrations must preserve previously logged entries.

---

## Task 1 — Bristol Stool Scale integration (highest priority)

Replace the current free-form "BM type" / "Poop consistency" fields with the Bristol Stool Scale:

- Selector with Types 1–7, each with a short plain-language descriptor (e.g., "Type 1 — Separate hard lumps", "Type 4 — Smooth and soft, like a sausage").  
- Include simple illustrations or clear iconography for each type if feasible; text-only acceptable for v1.  
- Bristol type must flow through to History, CSV export (new column: `bristol_type`), and PDF export.  
- Keep an optional free-text notes field alongside it.  
- Migrate gracefully: old entries without a Bristol type show "Not recorded."

## Task 2 — Notifications & reminders

Using Expo Notifications (local notifications only, no push server):

- **Timed sit reminders:** user can set 1–3 daily reminder times in Settings (e.g., after breakfast, after dinner). Notification text should be gentle and discreet, e.g., "Sit time in 10 minutes" — never mention encopresis or bowel language in the notification (it appears on the lock screen).  
- **Daily log nudge:** optional single evening reminder ("Quick log for today?"), default off, configurable time.  
- All reminders manageable from Settings: on/off toggles \+ time pickers.

## Task 3 — History screen cleanup

- Collapse "Not logged" fields by default — each day's card shows only what WAS logged. Add a per-day "Show all fields" expander.  
- Calendar view: turn it into a simple month heatmap — green for accident-free logged days, amber for days with accidents, grey for unlogged days.  
- Keep List view and both export buttons exactly where they are.

## Task 4 — Daily Log UI fixes

1. **Date field:** replace the YYYY-MM-DD text input with a native date picker (default today, allow backdating).  
2. **Bowel movements selector:** the current "SP / Suppository BM / No BM" segmented control is cramped and labels collide. Rework as clearly labeled chips or stacked options: "Spontaneous BM", "Suppository-assisted BM", "No BM". Multiple BMs per day should be supported if the data model allows; if not, flag it.  
3. **Water units:** add oz/mL toggle in Settings; default to mL for locales using metric, oz for US locale. Store a canonical unit internally.  
4. **Meds/Protocol glossary:** add a small info (ⓘ) icon next to the Meds/Protocol section that opens a glossary sheet explaining each term (Miralax/Restoralax/PEG, Senna/Ex-Lax, LGS, Multi-MOP, MOP x, Mag citrate, "Clean out", "Timed sits"). Write definitions in plain parent-friendly language with a "your clinic's protocol may differ" note.  
5. **Custom meds:** allow user to add a custom medication chip in Settings (name only). Custom meds appear in the Daily Log chips and exports.

## Task 5 — Positive reinforcement (small, kid-facing)

- Add a simple streak indicator on the Progress tab: consecutive days logged, and consecutive accident-free days, with an encouraging visual (stars or similar).  
- Tone: celebratory but gentle. Setbacks must never look like failure — after an accident day, streak resets quietly with no negative messaging.

## Task 6 — Export polish

- Add `bristol_type` and any new fields to CSV.  
- PDF export: add a one-page summary at the top — date range, total BMs (spontaneous vs. assisted), accident count and trend, Bristol type distribution, sit compliance %, medication days. Table of daily detail follows on subsequent pages.  
- File naming: `encopresis-log_YYYY-MM-DD_to_YYYY-MM-DD.csv/pdf`.

---

## Definition of done

- [ ] App builds and runs in Expo Go / dev build with no new warnings  
- [ ] Previously saved entries still load correctly (no data loss)  
- [ ] Bristol scale appears in Daily Log, History, CSV, and PDF  
- [ ] Reminders fire correctly and respect on/off settings  
- [ ] History shows compact day cards; calendar heatmap renders  
- [ ] Date picker, BM selector, unit toggle, and glossary all functional  
- [ ] No secrets or hardcoded credentials in source  
- [ ] Brief written summary of what changed and anything flagged for the owner's decision

## Out of scope for v1 (do not build)

Multi-child profiles, caregiver/account sharing, cloud sync, Android-specific polish beyond what Expo gives for free, gamification beyond the simple streak, in-app clinician messaging.  
