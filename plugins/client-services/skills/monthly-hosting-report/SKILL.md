---
name: monthly-hosting-report
description: >-
  Use when running the monthly hosting report for one site or all sites:
  collect, diff, render the email, stage it for approval, and send only what
  was approved unchanged. Dry run unless --live.
metadata:
  bstack-config: "sources: hosting.sites approvals.pages | settings: hosting.snapshots_dir hosting.reports_dir hosting.sender_name hosting.project_url hosting.render_kit_dir hosting.render_brand_file email_send.from email_send.reply_to? email_send.ledger_file hosting.agent_ops_dir?"
  bstack-sources: "hosting.sites: read; approvals.pages: read-write"
  bstack-needs: "shell files web"
  bstack-sends: "yes"
  bstack-money: "yes"
  bstack-scope: "work"
---
# Monthly hosting report

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

## Purpose

Run the whole chain for a month, in order, stopping at the first failure: hosting-metrics-collect, hosting-snapshot-diff, email-render (in the email render kit repo), approval-stage (build, stage), email-send.

## Inputs

- `--month <YYYY-MM>`, `--site <id>` or all enabled sites.
- A checkout of the email render kit with `npm ci` done. Its model schema must equal `schemas/hosting-report-model.v1.schema.json` here; the runner refuses to run otherwise.

## Outputs

Per site, in `hosting.reports_dir/<site>/<month>/`: `model.json`, `review-note.md`, `email.html`, `email.txt`, `preview.html`, chart PNGs, `rendered.json`, `draft.json`, `staged.json`, `send.json`. Dry runs add `requests.*.dry-run.json`.

## Config

- `hosting.render_kit_dir`: the render kit checkout. `hosting.render_brand_file`: your email-brand file (kept outside both repos).
- `hosting.agent_ops_dir`: only if agent-ops is not the sibling plugin folder.
- Everything the five steps declare.

## Env vars

Through `secrets`: `uptimerobot`, `pagespeed`, `forge`, `stripe` (collect), `notion` (stage, send), `resend` (send). Only `--live` reads `notion` and `resend`.

## How to run

```
npx tsx skills/monthly-hosting-report/run.ts --month 2026-10 --config <workspace.json>
```

Dry run end to end: `--skip-collect --send-mocks ../agent-ops/examples/mocks/routes.json --simulate-approval`. Real run, after the month ends: add `--live`, then approve each review page, then run again with `--skip-collect --live` to send.

## Failure behavior

Each step is its own process; the first non-zero exit stops the run with that step's message. Re-running is safe: snapshots are frozen, staging the same draft is a no-op, and the ledger stops a second send.
