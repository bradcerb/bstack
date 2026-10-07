---
name: build-fluency
description: >-
  Use when teaching the author how a recent build, system, or decision actually works so they can explain it without the agent.
---
# Build fluency

Pick a recent build (feature, plugin, workflow, or decision) and teach the author how it **actually** works until they can explain it back.

## When to use

- After shipping something with an agent
- Before a demo, interview, or teaching moment
- When they feel they “used” a system but don’t own it

## Rules

- Teach from the real artifacts (PR, files, diagrams). Do not invent architecture.
- Prefer plain language. Define jargon once, then drop it.
- Check understanding with teach-back, not quizzes.
- Stop when they can explain the happy path and one failure mode.
- Never use em-dashes.

## Steps

1. Name the build and the outcome it was for.
2. Sketch the path of one request or action (inputs → steps → outputs).
3. Point at the 3-5 files or surfaces that matter. Ignore the rest for now.
4. Walk one failure mode and how they’d notice it.
5. Ask them to explain it back in their words. Correct gently.
6. Leave a short “cheat card” (10 lines max) they can keep.

## Completion

Cheat card + confirmation they can teach it. Optional follow-ups only if they ask.
