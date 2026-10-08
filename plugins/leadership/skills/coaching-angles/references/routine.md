# Scheduled routine

This skill runs on demand. A host can also schedule it. The schedule lives in the host (a cron entry, an agent routine, a slash command). This repo does not register the clock.

## Cadence

Once a week is a sound default, or the morning after a standing block of team calls. Pick the clock in the host. Resolve date phrases in `workspace.timezone` when that setting is set.

## Default window

When the routine does not pass a window:

1. Read `leadership.coaching_state`. If the file has `last_run_at`, the window starts there and ends now.
2. If the file is missing or has no `last_run_at`, the window is the last 7 days.
3. After that default run, write `last_run_at` as the run time.

State file shape:

```json
{
  "last_run_at": "2026-03-18T15:00:00Z"
}
```

## Override

The caller can replace the default window. Accept a phrase or explicit dates. Resolve them to a start and end, and print both in the brief.

Examples a host prompt can pass:

- `last two weeks`
- `last 7 days`
- `2026-03-01 through 2026-03-14`
- `last two weeks` plus a person filter

An override does not move `last_run_at`. The next default run still starts from the last default run.

## Host prompt

```
Run coaching-angles. Use the default window (since the last run, or the last 7 days). Do not message, post, or schedule anything. If no person has a moment that clears the bar, return one quiet line and stop.
```

To override:

```
Run coaching-angles for the last two weeks.
```

## Quiet runs

A scheduled run with nothing to surface still finishes. One line is the whole result. Do not invent a moment to justify the run.
