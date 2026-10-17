# Features driven by verify.sh

| File | Run | Asserts |
| --- | --- | --- |
| approval-gate.md | 1 | an unapproved draft is staged, not sent |
| send-once.md | 2, 3 | approved draft sends once; the same key is refused after |
| monthly-collect.md | 4 | a new month collects, diffs, renders, stages |
| render-identity.md | none (CI) | v4 chart and template bytes stay identical |
