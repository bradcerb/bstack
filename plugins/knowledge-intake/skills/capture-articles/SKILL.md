---
name: capture-articles
description: >-
  Use when the caller submits an article URL, asks to save online reading into
  the knowledge base, or a scheduled knowledge-intake run has queued article
  links to capture as private raw Markdown with a kb.raw-index row.
metadata:
  bstack-config: "sources: kb.raw-index | settings: knowledge.raw_dir knowledge.monitored_pages?"
---
# Capture articles

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`knowledge.monitored_pages` is optional. Absent, empty, a value that starts with `REPLACE_WITH`, or a missing file means there is no queue. Capture the URL the caller submitted. Do not ask for the setting.

## Prerequisites

Write raw Markdown under `knowledge.raw_dir` and one index row in `kb.raw-index`. Do not create a database. Do not ingest browsing history. Take only an explicit submission or a URL listed in the monitored-pages file.

## Workflow

1. Normalize the URL. Strip tracking parameters. Discover the canonical URL.
2. Attempt direct HTTP retrieval and deterministic article extraction first.
3. Fall back to one reused signed-in browser session for pages that need it. Never store credentials or defeat access controls.
4. Reject login pages, bot challenges, navigation-only pages, and implausibly short extractions.
5. Convert the body to Markdown. Preserve headings, lists, links, quotations, code, and meaningful images.
6. Apply `knowledge.routing_policy` before the write, when that setting is present.
7. Write one immutable raw file under `knowledge.raw_dir` using a lowercase slug and a stable URL hash. Frontmatter:

```yaml
---
title: "Article title"
source_type: article
status: raw
visibility: private
external_id: "<stable hash or canonical URL>"
source_url: "<canonical URL>"
submitted_url: "<original URL>"
author: "<when available>"
published_at: "<ISO-8601 if known>"
captured_at: "<ISO-8601>"
word_count: 0
raw_path: "<relative path>"
---
```

8. Upsert a `kb.raw-index` row pointing at the blob. Status `raw`. Do not paste the full body into the index when it is large.
9. Deduplicate by canonical URL and content hash. Mark a queue item handled only after the raw write and the index upsert both succeed.

## Result

Return counts and exact filenames and index row refs. Do not invoke wiki-ingest unless the caller asked for a standalone end-to-end ingest.
