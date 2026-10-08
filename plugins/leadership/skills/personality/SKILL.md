---
name: personality
description: >-
  Use when someone asks for a person's DISC profile and a short plain read on
  how to work with them. Reads the configured source on every request. Does
  not infer a style, cache a profile, or send anything.
metadata:
  bstack-config: "sources: people.profiles"
---
# Personality

## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

A source kind is one key in `sources`, even when the name contains a dot. `people.profiles` means `sources["people.profiles"]`. The alias table is in repo-root SOURCES.md.

Pull one person's DISC profile from that binding and add a short plain read on how to work with them. Read the source every time.

Delivery notes: [disc-read.md](references/disc-read.md). Method context: [method.md](../../references/method.md).

## Inputs

- The person's name, as the caller uses it on the roster.
- `people.profiles`. Read it on this request. Do not reuse a profile from an earlier run, a brief, or a transcript. `paste` means the caller supplies the profile in the conversation.

## Steps

1. Look up that person in `people.profiles`.
2. If the source has no profile for them, stop with "Profile missing." Do not fill the gap.
3. Return the profile as stored: letters, blend, or the source's own short text. Do not translate it into a different model.
4. Add the plain read from [disc-read.md](references/disc-read.md) only for letters the source actually stores. If the source stores prose and no letters, return the prose and skip the letter read.

## Output

```
## Personality
Person: <name>
Source: <people.profiles label>
Profile: <as stored, or "Profile missing.">
How to work with them: <plain read, or omit when the profile is missing>
```

## Hard rules

- No cache. No local copy of the profile in skill files or loop state.
- No fallback source. If this source fails or the person is absent, the profile is missing.
- Do not infer a style from behavior, call transcripts, or a guess about the job.
- Do not name a product, tenant, or account. The binding is the source.
- Do not message the person. This is a read for the manager.
