# Encopresis Daily Tracker (Parents)

## Problem Statement
Parents treating encopresis need an easy mobile app to log daily accidents, bowel movements (SP/enema/none), medication, hydration/fiber, leaks, and activity, then share long-term progress with clinicians (CSV/PDF) and view trends.

## Architecture
- **Frontend:** Expo (tabs: Daily Log, History, Progress, Resources, Settings)
- **Backend:** FastAPI + MongoDB
- **Data:** Daily entry documents with optional fields, supports partial logs
- **Notifications:** Local reminders via expo-notifications
- **Exports:** CSV + PDF sharing via expo-print + expo-sharing

## Implemented Features
- Daily log form (accidents, leaks, BM type, meds/protocol multi-select, hydration & diet, activity, notes) with partial entry support
- History list with detailed cards and export/share CSV & PDF (meds displayed as comma-separated)
- Progress tab with stacked bar chart for Leaks / Enema / SP / Activity over time plus meds impact view
- Pediatrician report generator (last 30 days) with PDF export, summary metrics, charts, and detected patterns
- Resources tab with placeholder external links
- Settings for unit preferences and daily reminders
- CRUD API for entries with date normalization

## Backlog
### P0
- Multi-child profiles (separate logs per child)
- Clinician summary view (weekly/monthly aggregates)

### P1
- Data filters (date range selector for chart/history)
- In-app analytics (average accidents per week, leak-free streaks)

### P2
- Cloud backup / account sync
- Custom reminder schedules (multiple times per day)