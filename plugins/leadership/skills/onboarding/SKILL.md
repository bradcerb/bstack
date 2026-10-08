---
name: onboarding
description: >-
  Use to fill config for one named skill: ask only for the entries that skill
  declares as missing in workspace.json, write the v2 bindings, and stop.
  Does not interview for the whole stack.
---
# Onboarding

## Config check

This skill declares no config of its own. It has no `bstack-config` line. Do not ask the caller to configure onboarding.

Then ask which one skill to set up, if the caller has not already named exactly one. A request to do every skill, the whole plugin, or "everything missing" is not a name. Ask for a single skill name and wait. Do not start a second skill in the same run.

## Steps

1. Confirm one skill name. Match it to a `SKILL.md` whose frontmatter `name` is that skill.
2. Search `plugins/*/skills/<name>/SKILL.md` in the active workspace, then a skills directory the caller points at. If several files match, ask which file. If none match, ask for the path to that one skill and stop until you have it.
3. Read the `bstack-config` line in that file's frontmatter, using [field-declaration.md](references/field-declaration.md). If the file has no such line, say this skill declares no config, and stop.
4. Find `workspace.json`: the path the caller gave, else the active workspace root. If the file is missing, start a new one when you write. Do not copy every placeholder from the example into it.
5. Resolve each declared source kind under `sources` and each setting as a dotted path. A kind that contains a dot is still one key. An entry is missing when it is absent, empty, or a string that starts with `REPLACE_WITH`, including inside a nested object or list. Entries marked `?` that are absent or bound with `"via": "none"` are not missing.
6. If the v2 entry is missing, check the alias table in repo-root SOURCES.md. A filled old value counts as present. The literal `paste` counts as `{ "via": "paste" }`. Any other filled string counts as `{ "via": "connector", "target": "<that string>" }`.
7. If nothing is missing, and no entry is present only under an old name, say so and stop. If an entry is present only under an old name, rewrite it into the v2 shape, delete the old key, and stop.
8. Ask only for the entries that are still missing. Write each answer in the v2 binding shape. Delete the old key when you replace an alias. Leave every unrelated key alone. Then stop.

Do not run the named skill after writing unless the caller asks for that as a separate step.

## Hard rules

- One skill per run.
- Do not interview for entries that skill did not declare on its `bstack-config` line.
- Do not invent entries from the skill title, from a sibling skill, or from memory of a stack.
- Do not message anyone. This only edits the local config file the caller owns.
- Works for any skill that declares `bstack-config`, not only leadership skills.
