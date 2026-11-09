---
name: verify-hosting-report
description: >-
  Use after changing the hosting report kit (collect, diff, runner, approval,
  send, or the render kit) to drive the whole chain as a user would, in a
  scratch workspace with recorded responses, and keep evidence.
metadata:
  bstack-needs: "shell files"
  bstack-sends: "no"
  bstack-money: "no"
  bstack-scope: "work"
---
# Verify hosting report

## Purpose

Prove the monthly chain still works end to end, beyond unit tests: collect, diff, render, stage, approve, send once, refuse a second send.

## Inputs

- A render kit checkout (the email repo with `email-render`), dependencies installed.
- This plugin and `plugins/agent-ops`, dependencies installed.

## Outputs

`.out/evidence/<UTC time>/`: the rendered report folder after the send, the refused second `send.json`, a freshly collected month, the run logs, the dry-run ledger, and `SHA256SUMS`.

## Config

None. The script builds a scratch workspace from `examples/` and the render kit's `config.example/`. It never reads real config.

## Env vars

None real. It passes dummy key values to the collector, which only talks to recorded responses.

## How to run

- Launch and drive: `skills/verify-hosting-report/verify.sh <render-kit-dir>`.
- Doctor: the script checks dependencies and that the model schema is identical in both repos before anything else; exit 2 means fix setup, not code.
- Drive: four runs, see `features/`. Each asserts on `send.json`.
- Evidence: open `2026-10-after-send/preview.html` in a browser and look at it; compare `SHA256SUMS` between runs to spot unintended render changes.
- Cleanup: the scratch workspace is deleted on exit; delete old evidence folders by hand.

## Failure behavior

Stops at the first failed assertion with a non-zero exit and leaves no scratch files. Network is never used: every request goes to `examples/mocks` or `agent-ops/examples/mocks`, and `--live` is never passed.
