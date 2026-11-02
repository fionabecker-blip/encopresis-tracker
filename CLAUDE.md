# Gut Check — Project Briefing for Claude

Read this at the start of every session. It explains what this app is, who it's for, and how to work with me.

## What this app is
- **Gut Check — Bowel Health Tracker for Kids.** A mobile app that helps parents track a child's bowel health, built to support structured bowel-retraining protocols (e.g. the MOP protocol) that a child's doctor has prescribed.
- **Who uses it:** tired, busy parents, often logging one-handed at 7am. Every screen should be fast, simple, and calm.
- **Who it must earn trust from:** pediatricians and GI specialists. Tone is clinical and credible, never cutesy. The app is a companion to the doctor, never a replacement — no diagnosis, no medical advice.
- **Owner:** Fiona. Smart, not a programmer. Learning as she goes.

## Tech basics
- Expo / React Native (Expo SDK 54), published to both iOS (App Store) and Android (Google Play).
- All data is stored **on the device only**. The old shared backend was removed on purpose.
- Includes a CSV export so parents can share logs with their child's doctor.
- Pricing: free download with a one-time $9.99 USD in-app purchase to unlock.
- If anything in this section doesn't match the code, tell Fiona and update this file.

## Current status
- v1 is complete: security audit done, TestFlight done, privacy policy and store listings written.
- Next: submit to the App Store and Google Play.
- **Default mode right now is launch, not new features.**

## Non-negotiable rules
1. **This is children's health data.** Never add anything that sends data off the device — no analytics, tracking, crash-reporting, or cloud sync — without Fiona's explicit approval and a privacy-policy update.
2. **Never put passwords, API keys, or secrets in the code or in chat.** If something needs one, explain where it should go safely.
3. **Never delete or reset a user's stored data**, including during migrations or updates. Existing logs must survive every app update.
4. **Don't change the privacy policy, pricing, or in-app purchase setup** without asking first.

## How to work with Fiona
- **Explain in plain English.** Say what you changed and why in 2–3 sentences. No jargon without a one-line explanation.
- **Plan before big changes.** For anything touching more than one screen or the data layer, show a short plan and wait for approval.
- **Save a checkpoint first.** Commit the current working state before starting any change, so we can always go back.
- **One change at a time.** Finish, test, and confirm one thing before starting the next.
- **Prove it works.** Don't say "done" until you've run it, and tell her exactly how to check it on her phone.
- **Two failures means stop.** If the same fix fails twice, stop and explain what's actually going wrong before trying again.
- **Flag scope creep.** If a request drifts away from the current goal (launch), say so and offer to add it to the parking lot below instead.
- **Report detours.** If something didn't work and you did it a different way, say so in one sentence.
- **End every session with:** what's done, what's not, and the very next step.

## Ideas parking lot (not now — after launch)
- MCP connector so a parent's AI assistant could read and summarize the log (e.g. for a doctor's visit).
