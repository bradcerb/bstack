---
name: approval-stage
description: >-
  Use when any drafted email must be approved by a person before it can be
  sent: freezes the draft and its recipients under one hash, stages a review
  page, and confirms approval only for that exact hash.
metadata:
  bstack-config: "sources: approvals.pages | settings: email_send.from email_send.reply_to? approvals.statuses?"
  bstack-sources: "approvals.pages: read-write"
  bstack-needs: "shell files web"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "any"
---
# Approval stage

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

## Purpose

Put a human gate in front of a send that code enforces. `check` is the only code that can produce an `ApprovedDraft`, the one type email-send accepts.

## Inputs

- A folder with `rendered.json` (rendered-email v1 from an email render kit) and the files it lists.
- `--key`: a stable idempotency key per message, `--to`: recipients, `--note`: optional reviewer note inside the folder.

## Outputs

- `build` writes `draft.json` (email-draft v1). `draftHash` covers sender, recipients, subject, and every file hash.
- `stage` creates one review page per `draftHash` (Status, Key, Subject, Draft hash; reviewer note and email text in the body) and writes `staged.json`.
- `check` prints `approved` only when the page says Approved and its Draft hash equals the draft on disk.

## Config

- `sources["approvals.pages"]`: connector binding; `target` is the approvals database id. It needs Name (title), Status (select), Key, Subject, Draft hash (text).
- `email_send.from`, `email_send.reply_to`: the envelope written into the draft.
- `approvals.statuses`: optional `{ "review", "approved", "sent" }` names. Default Needs review, Approved, Sent.

## Env vars

`secrets.notion`, read only with `--live`.

## How to run

```
cd plugins/agent-ops && npm ci
npx tsx skills/approval-stage/stage.ts build --dir <dir> --key <key> --to a@x.com,b@y.com --note <dir>/review-note.md
npx tsx skills/approval-stage/stage.ts stage --dir <dir> --title "<page title>" [--live]
npx tsx skills/approval-stage/stage.ts check --dir <dir> [--live]
```

## Failure behavior

Any edit after `build` (a file, a recipient, `draft.json` itself) fails the hash check. A draft rebuilt after staging needs a new stage and a new approval. Without `--live`, requests go to recorded responses and are saved next to the draft.
