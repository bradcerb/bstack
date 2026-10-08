# Field declaration

Skills that read a source, a roster, or a schedule declare their fields in `SKILL.md` in a sentence that starts with "This skill requires". Start reading at those words. Backtick names from there until the period that ends the sentence are the fields. Ignore every other backtick in the file, including `workspace.json` earlier on the same line, and including examples in a `references/` folder.

Periods inside a backtick name are part of the path. Do not end the sentence at those periods. End it at the first period that sits outside backticks.

This onboarding skill has no declaration sentence. Do not treat the words in its instructions as a field list.

## Resolve a name

- A name with no dot is a top-level key in `workspace.json`. Existing skills use this form (`inbox_source`, `work_queue_source`, and the rest).
- A name with dots is a path. `leadership.disc_source` means the object `leadership`, then the key `disc_source`.
- Walk objects. A missing segment along the path means the field is missing.

## Missing

The field is missing when:

- the key or path is absent
- the value is `null` or `""`
- the value is a string that starts with `REPLACE_WITH`

If the value is an object or a list, walk the string leaves inside that declared field only. Any empty leaf or any leaf that starts with `REPLACE_WITH` means the field is still missing. Ask for those leaves. Do not ask about sibling keys the sentence did not name.

`paste` is a filled value. A real path, label, or connector name is a filled value. A default path that does not start with `REPLACE_WITH` is filled.

## Write

Update only the paths you asked about. Create parent objects if the path needs them. Keep unrelated keys, including other keys inside `leadership`.

If `workspace.json` does not exist, create it with the answered keys only. Do not dump the example file in first. The example is a guide for humans; the interview writes what this one skill needs.

## Stop

After the write, or after you report that nothing is missing, stop. Do not open the next skill's declaration in the same run.
