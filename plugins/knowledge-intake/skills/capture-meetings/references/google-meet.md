# Google Meet

Use Google Calendar as discovery and Google Drive as artifact storage. Inspect event attachments and recording or notes links after the meeting ends. Prefer an attached transcript or generated notes document; otherwise use an authorized recording from the organizer's Meet Recordings area and transcribe locally.

Search `knowledge.meeting_lookback`. Artifacts may not be ready immediately. Resolve a relative window in the calendar timezone, or in `workspace.timezone` when the calendar binding does not name one. Preserve the calendar event id and the artifact id for deduplication.

## Person filter

Calendar attendees include a display name and an email. When `person` is set, map `displayName` to `name` and `email` to `email`, then run `meeting_params.py filter`. Match only those fields. A name-only guest matches a name. An email-only guest matches an email. Do not scan the transcript.
