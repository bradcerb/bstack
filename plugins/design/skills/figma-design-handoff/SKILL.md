---
name: figma-design-handoff
description: >-
  Use when moving UI from brief → Figma → critique → code (email kits, websites,
  product UI).
---
# Figma design handoff

Pipeline: a design seat builds in Figma → a critique seat reviews → a web or native engineer seat executes in code.

## Roles

- Design builds real frames (not specs-only).
- Critique must cover mobile/responsive and real UI issues, not brand chrome only.
- Engineers implement from the Figma. No invent-from-screenshot when Figma exists.

## Kit-first

Duplicate shadcn/lib (or the project kit). Do not edit upstream packages.

## Heroes and motion

- Heroes: eyebrow → loud display → lede.
- Motion: use installed Emil Kowalski skills when relevant (`emil-design-eng`, `animate`, `review-animations`, etc.). No dedicated motion bot  -  see **Motion craft**.

## Out of this mental model

Backend / platform work is a separate execution lane, not part of the Figma pipeline.
