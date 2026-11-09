---
name: hosting-metrics-collect
description: >-
  Use when measuring a hosted site for a month: uptime, speed, SSL, domain,
  server, backups, and billing, written as one frozen snapshot file. Every
  source fails soft; a missing key or API error is recorded, never guessed.
metadata:
  bstack-config: "sources: hosting.sites | settings: hosting.snapshots_dir"
  bstack-sources: "hosting.sites: read"
  bstack-needs: "shell files web"
  bstack-sends: "no"
  bstack-money: "yes"
  bstack-scope: "work"
---
# Hosting metrics collect

## Config check

Do this before any other step. Find the config: a host profile (JSON with `bstack_host_version`) in the host's instructions or at a path the caller gave, else `bstack-host.json` in the active workspace root, else `workspace.json` at the path the caller gave or in that root, else ask once where `workspace.json` is. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. In `workspace.json`, if a required entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. A host profile is read-only: never write it and never ask to fill it. There, a required source that is absent or `"via": "none"` acts as `paste` (ask in the conversation for what you would read, return what you would write, and say "`<kind>` is not bound in this host"), and a required setting that is absent takes its default in SOURCES.md, or with no default, one answer for this run only. If a source is bound to a connector or a tool this host does not have, stop and say "`<kind>` is bound to `<name>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.

## Purpose

Measure one site for one month and write `snapshot-<siteId>-<YYYY-MM>.json` (hosting-snapshot v1). This is the only skill in the kit that touches the network for metrics.

## Inputs

- `--site <id>` and `--month <YYYY-MM>`. `--as-of <YYYY-MM-DD>` for point-in-time checks (defaults to today).
- The site entry in the `hosting.sites` file (hosting-sites v1, schema in `schemas/`).

## Outputs

- One snapshot in `hosting.snapshots_dir`. Each source has `ok`, `unavailable`, or `error` and a reason; its section is `null` unless ok. Snapshots are frozen: a second run refuses to overwrite without `--force`.

## Config

- `sources["hosting.sites"]`: a file binding to your sites file. Copy the shape from `examples/sites.json`.
- `hosting.snapshots_dir`: where snapshots live.

## Env vars

Named under `secrets` in `workspace.json`, never stored there: `uptimerobot`, `pagespeed`, `forge`, `stripe` (read-only keys). A missing entry or unset variable makes that source `unavailable`. SSL (openssl), response time (curl), and domain (RDAP) need no key.

## How to run

```
cd plugins/client-services && npm ci
npx tsx skills/hosting-metrics-collect/collect.ts --site <id> --month 2026-10 --config <workspace.json>
```

Dry run with recorded responses: add `--mocks examples/mocks/routes.json --exec-mocks examples/mocks/exec.json`.

## Failure behavior

A source that cannot measure is `unavailable` or `error` with a short reason; its numbers stay `null`. Key values are masked out of every reason. The snapshot is schema-checked before it is written. Bad config (unknown site, malformed sites file or hosting block) stops the run with the exact field.
