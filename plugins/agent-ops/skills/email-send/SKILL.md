---
name: email-send
description: >-
  Use when sending an email that approval-stage approved: sends through
  Resend with an idempotency key, records it in a ledger, and never sends a
  key twice or a draft that changed after approval.
metadata:
  bstack-config: "sources: approvals.pages | settings: email_send.ledger_file approvals.statuses?"
  bstack-sources: "approvals.pages: read-write"
  bstack-needs: "shell files web"
  bstack-sends: "yes"
  bstack-money: "no"
  bstack-scope: "any"
---
# Email send

## Config check

Do this before any other step. Find the config: a host profile (JSON with `bstack_host_version`) in the host's instructions or at a path the caller gave, else `bstack-host.json` in the active workspace root, else `workspace.json` at the path the caller gave or in that root, else ask once where `workspace.json` is. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. In `workspace.json`, if a required entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. A host profile is read-only: never write it and never ask to fill it. There, a required source that is absent or `"via": "none"` acts as `paste` (ask in the conversation for what you would read, return what you would write, and say "`<kind>` is not bound in this host"), and a required setting that is absent takes its default in SOURCES.md, or with no default, one answer for this run only. If a source is bound to a connector or a tool this host does not have, stop and say "`<kind>` is bound to `<name>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

## Purpose

Send approved drafts, once. `send()` takes only an `ApprovedDraft`, which only approval-stage can issue; it re-checks the review page right before sending.

## Inputs

- `--dir`: a folder with `draft.json` and `staged.json` from approval-stage.

## Outputs

- `send.json`: sent, skipped (with reason), or blocked.
- One ledger line per send in `email_send.ledger_file` (key, draft hash, email id, recipients, time). The review page moves to Sent.

## Config

- `email_send.ledger_file`: the send ledger. Keep it; it is the record that stops a second send.
- `approvals.statuses`: same as approval-stage.

## Env vars

`secrets.notion` and `secrets.resend`, read only with `--live`.

## How to run

```
npx tsx skills/email-send/send.ts --dir <dir> [--live]
```

Dry run: `--mocks examples/mocks/routes.json`, plus `--simulate-approval` to act as the reviewer. Neither is allowed with `--live`.

## Failure behavior

Not approved, changed, or not staged: skipped with the reason, nothing sent. Key already in the ledger: skipped if the same draft, blocked if different content. Live run with a placeholder address: blocked before any request. Resend's idempotency key equals the ledger key, so a retry after a crash does not deliver twice.
