# Open items log

`leadership.open_items_log` is a JSON file the manager owns.

```json
{
  "items": [
    {
      "id": "oi-<unique>",
      "person": "<name>",
      "direction": "they-owe",
      "kind": "coaching",
      "commitment": "<one sentence>",
      "due": "<YYYY-MM-DD or empty>",
      "status": "open",
      "opened_at": "<ISO time>",
      "updated_at": "<ISO time>",
      "closed_at": "",
      "acted_on": "unknown",
      "source": "<where it came from>"
    }
  ]
}
```

Generate `id` at add time (`oi-` plus a timestamp or other unique suffix). It is a local key for this file, not an identifier from another system.

`direction` is `they-owe`, `manager-owes`, or `shared`.

`kind` is `coaching`, `partner`, `project`, or `promise`. Coaching work-ons use `coaching`. Something the manager promised uses `promise` or `manager-owes`.

`acted_on` is `yes`, `no`, or `unknown`. It changes when the manager says what happened, usually at close.

## List filters

- Person: case-insensitive match on `person`.
- Overdue: `status` is `open`, `due` is a date, and `due` is before today.
- Due soon: `status` is `open` and `due` falls in the next 7 days, including today, unless the caller names a different horizon.
- No filter: every `open` row.

Sort overdue first, then by due date, then undated.

## Seen, not logged

A read source can show a candidate the log does not have. Display it under the list, labeled seen, not logged, with the source name. It is not an open item until add writes it to the log.
