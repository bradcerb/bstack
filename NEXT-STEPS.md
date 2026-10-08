# bstack next steps

Logged from my call on Thursday, Oct 8, 2026. Log only. Items 2 to 6 are in this PR (`plugins/leadership`). The rest is not built yet.

## In flight

1. **capture-meetings extension.** A date-range param ("last two weeks" or a set window) and a teammate filter are going into the standalone knowledge-intake-skills repo. Still to decide: does bstack's copy in `plugins/knowledge-intake` need the same change?

## Leadership skills

2. **Coaching angles (leadership).** Rank one coaching moment per person from call transcripts, tied to that person's growth area in the skill assessment. Shape the delivery by their DISC profile. One thing per person. Nothing gets sent. Runs on demand and as a scheduled routine, with a date-range override. In this PR: `coaching-angles` (DISC lookup defers to `personality`).
3. **Personality.** Config points to where each person's profile lives (the Rock MCP, a spreadsheet, whatever the team uses). Pull the DISC profile and return it on request. No cache, no fallback, no hardcoded company references. In this PR: `personality`.
4. **One-on-one prep.** Triumph's meeting-prep is thin and general: an Outlook plus Asana brief. Ours adds per-person history, open commitments, the last feedback given, and output shaped by personality. In this PR: `one-on-one-prep`.
5. **Open items** (renamed from feedback follow-through). Track any commitment: coaching work-ons, partner items, project next steps. Config has two fields: where to store the log and where to read from (local file, database, Asana, OneDrive). Record one-on-ones as transcripts for both people. In this PR: `open-items`.
6. **Onboarding.** A small interview for each skill that fills in only its missing config fields. Never the whole stack at once. The per-skill config check shipped in PR #2. In this PR: `onboarding`.

## Parked

7. How bstack describes its sources in config so it works across hosts.

## Worth exploring

8. Moments to use influence (Wes Kao), an expectations spec for handoffs, a team review digest, and growth over time measured against the skill assessments.
