# Send once

## Sub-features
- Only an `ApprovedDraft` reaches `send()`.
- Ledger keyed by idempotency key; Resend gets the same key.

## How to get to it (user POV)
Approve the review page, run again; the email goes out and the page moves to Sent. Running again does nothing.

## Driving it with verify.sh
Run 2 with `--simulate-approval`: status `sent`, mode `dry-run`. Run 3 the same: `skipped, already sent`.

## Gotchas
The dry-run ledger lives in the report folder, the live ledger at `email_send.ledger_file`. Deleting the live ledger removes the guard; Resend's key still dedupes for about 24 hours only.
