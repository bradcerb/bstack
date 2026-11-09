---
name: conference-who-to-meet
description: >-
  Use when preparing a conference trip: build who-to-meet lists from public
  speakers, exhibitors, and partners; rank Must/Should/Nice; draft warm
  pre-trip reach-outs, on-site openers, and 24–48h follow-ups. Do not use for
  producing the author's own event (run-of-show, vendors, dietary) or for
  standing CRM ownership outside a named trip.
metadata:
  bstack-config: "settings: relationships.author_lane? relationships.skip_list?"
  bstack-needs: "web?"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "any"
---
# Conference who-to-meet

## Config check

Do this before any other step. Find the config: a host profile (JSON with `bstack_host_version`) in the host's instructions or at a path the caller gave, else `bstack-host.json` in the active workspace root, else `workspace.json` at the path the caller gave or in that root, else ask once where `workspace.json` is. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. In `workspace.json`, if a required entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. A host profile is read-only: never write it and never ask to fill it. There, a required source that is absent or `"via": "none"` acts as `paste` (ask in the conversation for what you would read, return what you would write, and say "`<kind>` is not bound in this host"), and a required setting that is absent takes its default in SOURCES.md, or with no default, one answer for this run only. If a source is bound to a connector or a tool this host does not have, stop and say "`<kind>` is bound to `<name>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`relationships.author_lane` and `relationships.skip_list` are optional. Absent, empty, or a value that starts with `REPLACE_WITH` means this trip supplies them. Do not ask for the settings and do not stop.

One named trip → ranked list + paste-ready drafts. Draft only until the author explicitly says to send.

## Inputs

- Conference name, dates, venue
- Official hub URLs (speakers, schedule, partners/exhibitors)
- Author's lane (who they want to meet and why). A filled `relationships.author_lane` is the lane unless the caller names a different one for this trip. When the setting was skipped, take the lane from this trip.
- People to skip or prioritize. A filled `relationships.skip_list` is the skip list unless the caller adds names for this trip. When the setting was skipped, take the skip list from this trip.

## Networking bar (operational preferences)

- Prep 1–2 weeks out. Conference mention is the hook; the meeting is the goal.
- Generosity first: what can the author usefully offer (intro, tip, resource, attention)?
- Hallway/coffee over packing sessions. Cap Must to a workable plan (~5–12). Prefer one primary contact per org when focused.
- Strike around the talk: before they speak, not the post-talk line.
- Warm intros only with public evidence. Never invent mutuals, attendees, or RSVPs.
- Deep openers: specific research hook, not weather small talk.
- Follow up in 24–48h with one concrete next step. Queue; do not send until go.

## Steps

1. Pull the public roster; note gaps. When this host cannot fetch the web, ask the caller to paste the roster and any public bios, and say the list is only as good as that paste.
2. Enrich from public sources only, or from the paste when there is no web: role, org, why meet, hook, offer, source URL.
3. Rank Must / Should / Nice against the author's lane.
4. Draft short pre-trip reach-outs and matching on-site openers.
5. Optional: find emails with confidence labels (found vs guess).
6. After meets (or no-shows): draft 24–48h follow-ups.
7. If the roster is thin, say so. Never fake a headcount.

## Outreach frame

Soft "presenting on X" when true. Booth/wandering invite. Hook + offer. No pitch deck. No send, book, connect, or RSVP without go.

## Completion

Must/Should/Nice list + drafts grouped pre-trip / on-site / follow-up + channel named.
