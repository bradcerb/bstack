# Monthly collect

## Sub-features
- Each source returns ok, unavailable, or error; a failed source never stops the run.
- Diff against earlier snapshots, then render.

## How to get to it (user POV)
On the first of the month, run the report; a new snapshot and model appear for last month.

## Driving it with verify.sh
Run 4: month 2026-11 with collect mocks. Expect every source `ok`, a model, a render, a staged draft.

## Gotchas
`--as-of` fixes "today" so SSL and domain day counts are reproducible.
