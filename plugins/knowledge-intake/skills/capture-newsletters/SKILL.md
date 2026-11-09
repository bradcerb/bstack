---
name: capture-newsletters
description: >-
  Use when capturing approved newsletter mail or newsletter feeds into raw
  Markdown, or when a scheduled knowledge-intake run needs newsletter intake
  from the email.newsletters binding.
metadata:
  bstack-config: "sources: kb.raw-index email.newsletters | settings: knowledge.raw_dir knowledge.loop_state"
  bstack-needs: "files"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "any"
---
# Capture newsletters

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

## Policy

Read `email.newsletters` only: a mailbox label, an approved sender list, or an approved feed list. Never sweep the whole inbox. See `references/newsletter-policy.md`.

Treat delivery as capture, not consumption. Do not update reading metrics because a newsletter arrived.

Prefer the complete mail body for a truncated issue. Prefer the feed when it supplies the complete issue.

Keep the full issue private under `knowledge.raw_dir`. Preserve the canonical publisher URL when one exists.

## Prerequisites

Write raw Markdown under `knowledge.raw_dir` and one index row in `kb.raw-index`. Cursors live in `knowledge.loop_state`. Do not create a database. Do not reply, unsubscribe, or change mailbox rules.

## Workflow

1. Load `email.newsletters` and the mailbox or feed cursors from `knowledge.loop_state`.
2. Discover candidates. Dedupe mail by Message-ID and a feed by GUID or canonical URL.
3. Select the best HTML or plain-text part. Strip scripts, tracking pixels, reply chrome, and repetitive delivery controls. Preserve meaningful links and images.
4. Convert to Markdown. Reject confirmation, login, or unsubscribe-only messages.
5. Apply `knowledge.routing_policy` when that setting is present. Skip rejected categories.
6. Write one immutable raw Markdown file under `knowledge.raw_dir`. Suggested frontmatter:

```yaml
---
title: "Issue title"
source_type: newsletter
status: raw
visibility: private
external_id: "<Message-ID or feed GUID>"
source_url: "<canonical URL if any>"
author: "<sender>"
captured_at: "<ISO-8601>"
published_at: "<ISO-8601 if known>"
word_count: 0
raw_path: "<relative path under knowledge.raw_dir>"
---
```

7. Upsert a `kb.raw-index` row pointing at `raw_path`. Store status `raw`, title, source_type, external_id, source_url, and captured_at. Do not paste the full body into the index when it is large.
8. Advance the cursor in `knowledge.loop_state` only after the raw write and the index upsert both succeed, or after an explicit skip.

## Result

Return counts, exact raw filenames, and index row refs. Do not invoke the parent orchestrator or wiki-ingest.
