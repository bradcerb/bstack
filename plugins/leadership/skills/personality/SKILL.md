---
name: personality
description: >-
  Use when someone asks for a person's DISC profile and a short plain read on
  how to work with them. Reads the configured source on every request. Does
  not infer a style, cache a profile, or send anything.
---
# Personality

## Config check

Do this before any other step. Read the user-owned `workspace.json` in the active workspace. This skill requires `leadership.disc_source`.

If `workspace.json` is missing, or any required field is missing or still a placeholder, pause. A placeholder is an empty value or any value that starts with `REPLACE_WITH`, including inside nested objects and lists. Ask only for those missing fields. Write the answers into `workspace.json`. Then continue with the rest of this skill. Do not run a full onboarding interview.

A dotted name is a path: `leadership` is the object, then `disc_source`. The value may be a file path, a spreadsheet, or a connector name. `paste` means the caller supplies the profile in the conversation.

Pull one person's DISC profile from the configured source and add a short plain read on how to work with them. Read the source every time.

Delivery notes: [disc-read.md](references/disc-read.md). Method context: [method.md](../../references/method.md).

## Inputs

- The person's name, as the caller uses it on the roster.
- The configured source. Read it on this request. Do not reuse a profile from an earlier run, a brief, or a transcript.

## Steps

1. Look up that person in `leadership.disc_source`.
2. If the source has no profile for them, stop with "Profile missing." Do not fill the gap.
3. Return the profile as stored: letters, blend, or the source's own short text. Do not translate it into a different model.
4. Add the plain read from [disc-read.md](references/disc-read.md) only for letters the source actually stores. If the source stores prose and no letters, return the prose and skip the letter read.

## Output

```
## Personality
Person: <name>
Source: <leadership.disc_source label>
Profile: <as stored, or "Profile missing.">
How to work with them: <plain read, or omit when the profile is missing>
```

## Hard rules

- No cache. No local copy of the profile in skill files or loop state.
- No fallback source. If this source fails or the person is absent, the profile is missing.
- Do not infer a style from behavior, call transcripts, or a guess about the job.
- Do not name a product, tenant, or account. The config value is the source.
- Do not message the person. This is a read for the manager.
