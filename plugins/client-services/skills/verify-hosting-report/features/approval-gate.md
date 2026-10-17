# Approval gate

## Sub-features
- Draft hash covers sender, recipients, subject, every file.
- Review page per hash; stage is idempotent.

## How to get to it (user POV)
Run the monthly report for a site; a review page appears with the email text and reviewer note. Nothing is sent until Status is Approved.

## Driving it with verify.sh
Run 1: no `--simulate-approval`. Expect `send.json` status `skipped`, reason `not approved`.

## Gotchas
Editing any file after staging changes the hash; the page then shows a hash that no longer matches and the send is skipped as changed. Rebuild and restage.
