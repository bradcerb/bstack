---
name: onboarding
description: >-
  Use to fill config for one named skill: ask only for the fields that skill
  declares as missing in workspace.json, write the answers, and stop. Does
  not interview for the whole stack.
---
# Onboarding

## Config check

Do this before any other step. This skill declares no workspace fields of its own. Do not ask the caller to configure onboarding.

Then ask which one skill to set up, if the caller has not already named exactly one. A request to do every skill, the whole plugin, or "everything missing" is not a name. Ask for a single skill name and wait. Do not start a second skill in the same run.

## Steps

1. Confirm one skill name. Match it to a `SKILL.md` whose frontmatter `name` is that skill.
2. Search `plugins/*/skills/<name>/SKILL.md` in the active workspace, then a skills directory the caller points at. If several files match, ask which file. If none match, ask for the path to that one skill and stop until you have it.
3. Read the declaration sentence in that `SKILL.md`, using [field-declaration.md](references/field-declaration.md). If the file has no declaration sentence, say this skill declares no config fields, and stop.
4. Read `workspace.json` in the active workspace. If the file is missing, start a new one when you write. Do not copy every placeholder from the example into it.
5. A declared field is missing when it is absent, empty, or a string that starts with `REPLACE_WITH`, including inside a nested object or list at that path.
6. If nothing is missing, say so and stop.
7. Ask only for the missing fields. Write those answers into `workspace.json` and leave every other key alone. Then stop.

Do not run the named skill after writing unless the caller asks for that as a separate step.

## Hard rules

- One skill per run.
- Do not interview for fields that skill did not declare.
- Do not invent fields from the skill title, from a sibling skill, or from memory of a stack.
- Do not message anyone. This only edits the local config file the caller owns.
- Works for any skill in this repo that uses the declaration sentence, not only leadership skills.
