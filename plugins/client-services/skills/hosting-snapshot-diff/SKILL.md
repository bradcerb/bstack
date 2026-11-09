---
name: hosting-snapshot-diff
description: >-
  Use when turning monthly hosting snapshots into a worded report model:
  compares this month with earlier months, picks sentences by fixed rules,
  and writes model.json plus a reviewer note. Pure and offline.
metadata:
  bstack-config: "sources: hosting.sites | settings: hosting.snapshots_dir hosting.reports_dir hosting.sender_name hosting.project_url hosting.thresholds? hosting.copy_file?"
  bstack-sources: "hosting.sites: read"
  bstack-needs: "shell files"
  bstack-sends: "no"
  bstack-money: "yes"
  bstack-scope: "work"
---
# Hosting snapshot diff

## Config check

Do this before any other step. Find the config: a host profile (JSON with `bstack_host_version`) in the host's instructions or at a path the caller gave, else `bstack-host.json` in the active workspace root, else `workspace.json` at the path the caller gave or in that root, else ask once where `workspace.json` is. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. In `workspace.json`, if a required entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. A host profile is read-only: never write it and never ask to fill it. There, a required source that is absent or `"via": "none"` acts as `paste` (ask in the conversation for what you would read, return what you would write, and say "`<kind>` is not bound in this host"), and a required setting that is absent takes its default in SOURCES.md, or with no default, one answer for this run only. If a source is bound to a connector or a tool this host does not have, stop and say "`<kind>` is bound to `<name>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`hosting.thresholds` and `hosting.copy_file` are optional. Absent means the package defaults.

## Purpose

Build the hosting-report-model v1 for one site and month from snapshots. No network, no clock, no model in the numbers or the words: same inputs, same bytes.

## Inputs

- `--site <id>`, `--month <YYYY-MM>`. Snapshots for that month and up to `historyMonths` before it.

## Outputs

- `model.json` (schema `schemas/hosting-report-model.v1.schema.json`) and `review-note.md` in `hosting.reports_dir/<site>/<month>/`, or `--out <dir>`. The model lists the sha256 of every snapshot it read.

## Config

- `hosting.sender_name`, `hosting.project_url`: the signature and the booking link.
- `hosting.thresholds`: overrides for the defaults in `lib/config.ts` (for example `sslWarnDays`).
- `hosting.copy_file`: your own copy file. Same keys as `copy/copy.en.json`; only wording may change.

## Env vars

None.

## How to run

```
npx tsx skills/hosting-snapshot-diff/diff.ts --site <id> --month 2026-10 --config <workspace.json>
```

## Failure behavior

Every snapshot is schema-checked on read, and its site and month must match its file name. A section whose source was not ok is left out; no number is written from missing data. The model is schema-checked before it is written. A copy file with a missing key, an extra key, or an em-dash is refused.
