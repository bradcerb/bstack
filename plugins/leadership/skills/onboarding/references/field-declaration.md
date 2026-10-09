# Field declaration

A skill that reads a source or a setting declares its config once, in frontmatter:

```yaml
metadata:
  bstack-config: "sources: transcripts.meetings people.roster | settings: leadership.coaching_state workspace.timezone?"
```

The double-quoted string is the whole list. Do not also look for a sentence of required field names. That sentence is retired.

## Parse the line

Split the string on `|`. Each piece is `sources:` or `settings:`, then tokens separated by spaces.

- A token ending in `?` is optional. Strip the `?` before lookup.
- Source tokens are kind names. Look them up as keys of the `sources` object. `transcripts.meetings` is `sources["transcripts.meetings"]`, not a nested object.
- Setting tokens are dotted paths. `leadership.coaching_state` is the object `leadership`, then the key `coaching_state`. `workspace.timezone` is `workspace`, then `timezone`.

A skill with no `bstack-config` line declares nothing. Stop.

## Missing

The entry is missing when the key or path is absent, the value is `null` or `""`, or any string in the value starts with `REPLACE_WITH` (walk objects and lists).

Skip an optional entry when it is absent, or when a source binding is `{ "via": "none" }`. Do not ask.

`{ "via": "paste" }` is filled. A real path, label, connector name, or skill name is filled.

## Alias

If the v2 entry is missing, look up the old flat name in the alias table in this plugin's README. Those rows move to SOURCES.md later. Read that table. Do not hardcode a second copy.

A filled old value means the entry is present. When you write, write the v2 shape and delete the old key. Leave sibling keys in place. `leadership.coaching_state` and `leadership.coaching_briefs_dir` are already the v2 paths.

Read an old string with these rules: the literal `paste` is `{ "via": "paste" }`. Any other filled string is `{ "via": "connector", "target": "<that string>" }`. A list of filled strings is a list of those bindings.

## Write

A source binding is one of:

```json
{ "via": "connector", "connector": "<server name as this host shows it>", "target": "<thing inside it>", "name": "<optional label>" }
{ "via": "file", "path": "<relative to the workspace root, or absolute>" }
{ "via": "url", "url": "https://..." }
{ "via": "skill", "skill": "<skill name>", "target": "<call args>" }
{ "via": "paste" }
{ "via": "none" }
```

`none` is legal only for an optional kind. A kind that holds several bindings, such as `tasks.commitments`, is a list of those objects.

Ask which `via` the caller wants, then only the fields that form needs. Write that object at `sources["<kind>"]`. Write a setting at its dotted path. Create parent objects if the path needs them. Do not delete unrelated keys.

If `workspace.json` does not exist, create it with `bstack_config_version` set to `2` and the answered keys only.

## Stop

After the write, or after you report that nothing is missing, stop. Do not open the next skill's declaration in the same run.
