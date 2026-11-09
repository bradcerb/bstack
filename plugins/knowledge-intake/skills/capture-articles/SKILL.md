---
name: capture-articles
description: >-
  Use when the caller submits an article URL, asks to save online reading into
  the knowledge base, or a scheduled knowledge-intake run has queued article
  links to capture as private raw Markdown with a kb.raw-index row.
metadata:
  bstack-config: "sources: kb.raw-index | settings: knowledge.raw_dir knowledge.monitored_pages?"
  bstack-needs: "files? web browser?"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "any"
---
# Capture articles

## Config check

Do this before any other step. Find the config: a host profile (JSON with `bstack_host_version`) in the host's instructions or at a path the caller gave, else `bstack-host.json` in the active workspace root, else `workspace.json` at the path the caller gave or in that root, else ask once where `workspace.json` is. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. In `workspace.json`, if a required entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. A host profile is read-only: never write it and never ask to fill it. There, a required source that is absent or `"via": "none"` acts as `paste` (ask in the conversation for what you would read, return what you would write, and say "`<kind>` is not bound in this host"), and a required setting that is absent takes its default in SOURCES.md, or with no default, one answer for this run only. If a source is bound to a connector or a tool this host does not have, stop and say "`<kind>` is bound to `<name>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

`knowledge.monitored_pages` is optional. Absent, empty, a value that starts with `REPLACE_WITH`, or a missing file means there is no queue. Capture the URL the caller submitted. Do not ask for the setting.

On a profile host without `files`, skip the monitored-pages file and take only URLs submitted for this run. When `kb.raw-index` acts as `paste`, return the complete raw record with `body` in the reply, omit `raw_path`, and skip all file and index writes. Report it as prepared, not saved, and do not mark a queue item handled. When a fileless host binds `kb.raw-index` through something other than a tool or `paste`, stop and explain that this capture path needs a tool that stores the body too.

## Prerequisites

Write raw Markdown under `knowledge.raw_dir` and one index row in `kb.raw-index`. When `kb.raw-index` is bound to a tool, that tool is the store: send it the whole raw record in step 7, write no file, and do not read `knowledge.raw_dir`. Do not create a database. Do not ingest browsing history. Take only an explicit submission or a URL listed in the monitored-pages file.

## Workflow

1. Normalize the URL. Strip tracking parameters. Discover the canonical URL.
2. Attempt direct HTTP retrieval and deterministic article extraction first.
3. Fall back to one reused signed-in browser session for pages that need it. When the host profile does not list `browser`, skip this step and report the page as needing a browser. Never store credentials or defeat access controls.
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

   With a tool-bound `kb.raw-index`, do not write a file. Call the tool once with the same fields as one record, plus `body` (the Markdown) and `status: raw`. Leave `raw_path` out. The tool upserts by `external_id` and returns the record's id.
8. Upsert a `kb.raw-index` row pointing at the blob. Status `raw`. Do not paste the full body into the index when it is large. With a tool-bound `kb.raw-index`, step 7 was the upsert. Skip this step.
9. On file hosts, deduplicate by canonical URL and content hash. On tool hosts, use the canonical URL as `external_id`; recapturing that URL updates the existing record instead of making another. Mark a queue item handled only after the raw write and the index upsert both succeed, or after the tool confirms the save.

## Result

Return counts and exact filenames and index row refs. With a tool-bound `kb.raw-index`, return the ids the tool gave instead of filenames. Do not invoke wiki-ingest unless the caller asked for a standalone end-to-end ingest.
