# Microsoft Teams

Use the calendar as discovery and the provider's file store as artifact storage. Prefer an accessible VTT transcript over the recording. Transcript access may require administrator enablement and scoped permissions. Report missing access rather than attempting a workaround.

Search `knowledge.meeting_lookback`. Resolve a relative window in the calendar timezone, or in `workspace.timezone` when the calendar binding does not name one. Preserve the event id, the online meeting id, and the transcript or recording artifact id for deduplication.

## Person filter

Attendees and participants include a display name and an email address when Graph returns them. When `person` is set, map the display name to `name` and the email address to `email`, then run `meeting_params.py filter`. If a record has only one of those, pass only that field. A name-only record matches a name. An email-only record matches an email. Do not scan the transcript.
