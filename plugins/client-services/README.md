# client-services

Monthly hosting report per client site, from numbers to a sent email, with no model in the loop.

```
hosting-metrics-collect -> snapshot v1 -> hosting-snapshot-diff -> model v1 + review note
  -> email-render (other repo) -> rendered-email v1
  -> approval-stage (agent-ops) -> ApprovedDraft -> email-send (agent-ops) -> ledger
```

`monthly-hosting-report` runs the chain for every site in `hosting.sites`. Each skill also runs alone; its SKILL.md says how.

## Cross-repo dependency

Rendering is not in this repo. It lives in the email repo (`bradcerbemail`), in `scripts/render.tsx` (the `email-render` skill) and the `hosting-report` template.

- Point `hosting.render_kit_dir` at a checkout of that repo with `npm ci` done, and `hosting.render_brand_file` at an email-brand v1 file kept outside both repos.
- The handoff is `hosting-report-model.v1.schema.json`. It is copied in both repos (`schemas/` here, `lib/hosting-report/` there). The runner hashes both and refuses to render if they differ. Change the schema in both repos in the same pair of pull requests.
- The render kit hands back `rendered.json` (rendered-email v1). agent-ops validates it with its own consumer schema before building a draft.
- CI here cannot check out the private email repo, so the full chain is proven locally with `skills/verify-hosting-report/verify.sh <render-kit-dir>`. Each repo's CI covers its own half, including golden files on both sides of the handoff.

## Layout

| Path | Holds |
| --- | --- |
| `lib/` | shared types (branded ids, `SourceResult`), schema validator, workspace reader. Only `lib/workspace.ts` reads the environment |
| `schemas/` | snapshot v1, sites v1, hosting-settings v1, hosting-report-model v1 |
| `copy/copy.en.json` | every customer-facing sentence. Override with `hosting.copy_file` |
| `examples/` | neutral sites, six months of snapshots, collect mocks, a demo workspace, goldens |
| `skills/` | the four skills |

## What is enforced where

- Code: every handoff file is schema-checked when read and when written. Collectors return ok, unavailable, or error and never throw. diff and render import no network code. Only approval-stage can create an `ApprovedDraft`, and send re-checks it.
- CI (`scripts/repo-lint.mjs`, `npm run check`): no brand strings, no em-dashes, no `process.env` outside `lib/workspace.ts`, no network imports in pure layers, no `ApprovedDraft` casts, types, tests, the diff golden.
- Judgment: copy wording, thresholds, and what a reviewer approves.

## Cost

Uptime, PageSpeed, Forge, Stripe, RDAP, and TLS checks are free API calls. Resend is the only paid step: one email per site per month.
