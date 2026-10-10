# Sources

`workspace.json` is the only config file. Skills read it. They do not keep a second config, a plugin-local example, or an environment variable for the same fact.

This file is the vocabulary. The filled values live in the user's `workspace.json`, copied from [`examples/workspace.json.example`](examples/workspace.json.example).

## Config, state, and output

| Kind | What it holds | Where it lives |
| --- | --- | --- |
| Config | What the user chose: which inbox, which database, which folder, caps, timezone, voice files, feed lists | `workspace.json` only |
| State | What a run remembers: cursors, seen ids, `last_run_at`, in-flight locks | A file whose path is a setting in `workspace.json`, such as `knowledge.loop_state` or `leadership.coaching_state` |
| Output | What a skill produces: raw Markdown, briefs, logs, notes | A folder or file named in `workspace.json`, or a path chosen for that run |
| Package | `plugin.json` and marketplace manifests | This repo. They describe the plugin, not the user |
| Secrets | Tokens, keys, passwords | Host connector auth or the host secret store. Never in `workspace.json` |

A path inside `workspace.json` does not compete with it. A second file that chooses the same inbox, cap, or folder does.

## How to find workspace.json

Look in this order:

1. The path the caller gave.
2. `workspace.json` in the active workspace root, the folder the host treats as the workspace.
3. Ask once where the file is.

One file per host. Connector names differ by host, so do not share one file across machines. Put it at the root of the folder you run skills from. It is gitignored. Never commit it.

`workspace.root` defaults to `"."`, the folder that holds the file. Every relative path in the file resolves from that root.

## Declaration

A skill that reads config names its entries once, in frontmatter:

```yaml
metadata:
  bstack-config: "sources: email.inbox tasks.priorities calendar.events tasks.agent-queue chat.messages? | settings: workspace.timezone?"
```

The double-quoted string is the whole list. Split on `|`. Each piece is `sources:` or `settings:`, then tokens separated by spaces.

- A token ending in `?` is optional. Strip the `?` before lookup.
- A source token is one key of `sources`, even when the name contains a dot. `email.inbox` is `sources["email.inbox"]`.
- A setting token is a dotted path. `leadership.coaching_state` is `leadership`, then `coaching_state`.

A skill with no `bstack-config` line declares nothing and does not read `workspace.json`.

`metadata.bstack-sources` is a second frontmatter string. It names the access for kinds already listed in `bstack-config`: `read`, `write`, `read-write`, or `append`, separated by semicolons. It does not add a kind, and the config check does not read it. A skill with no `bstack-sources` line is unchanged.

An optional entry never blocks. Absent, empty, `"via": "none"`, or a value that starts with `REPLACE_WITH` is skipped. The skill keeps the behavior it had when that entry did not exist. Do not ask for it.

## Binding

A source value is one binding, or a list of bindings when the skill reads several (for example `tasks.commitments`).

```json
{ "via": "connector", "connector": "<server name as this host shows it>", "target": "<thing inside it>", "name": "<optional label>" }
{ "via": "file", "path": "<relative to workspace.root, or absolute>" }
{ "via": "url", "url": "https://..." }
{ "via": "skill", "skill": "<bstack skill name>", "target": "<call args>" }
{ "via": "paste" }
{ "via": "none" }
```

- `connector` names a server this host already shows. `target` is the thing inside it (inbox, database id, queue, field).
- `file` may use `paths` (a list) instead of `path` when the kind is several files, such as `voice.canon`.
- `url` is an address, not a file path.
- `skill` means call that skill and use what it returns. `transcripts.meetings` may be `{ "via": "skill", "skill": "capture-meetings", "target": "output=raw" }`.
- `paste` means the caller supplies that data in the conversation.
- `none` is legal only on an optional kind. It means skip.

`bstack_config_version` is `2`.

## Source kinds

| Kind | Read / write | What the skill expects | Declared by |
| --- | --- | --- | --- |
| `email.inbox` | read, plus archive and label | message list | daily-plan |
| `email.newsletters` | read | label, sender list, or feed list | capture-newsletters |
| `chat.messages` | read | message list | daily-plan (optional) |
| `calendar.events` | read; household skills may append one draft event and must not send invitations | events with attendees and attachments. A draft event is a prompt, not an invitation | daily-plan, capture-meetings; date-night, evening-activities, weekend-with-kids (optional) |
| `tasks.priorities` | read | the weekly-plan section "Next week (large priorities, ranked)" | daily-plan |
| `tasks.week-snapshot` | read | done, in flight, coming up, stuck | weekly-plan |
| `tasks.work-queue` | read and update | tickets, issues, tasks, pull requests | gated-work |
| `tasks.agent-queue` | write | gated-work handoff items | daily-plan |
| `tasks.commitments` | read (list of bindings). touch-note may append a promise, and the household skills append one reminder, to the first binding | candidate commitments, a promise, or a household reminder | open-items; touch-note; date-night, evening-activities, weekend-with-kids; circle-rotation (optional) |
| `transcripts.meetings` | read | team-call transcripts in a window | coaching-angles, one-on-one-prep; capture-meetings when a transcript tool is the source (optional) |
| `transcripts.one-on-ones` | read | past one-on-one notes or transcripts | one-on-one-prep |
| `people.roster` | read | names, and emails, on the team | coaching-angles |
| `people.assessments` | read | growth area per person | coaching-angles, one-on-one-prep |
| `people.profiles` | read, never cached | profile per person | personality |
| `people.circles` | read and write | one row per person. Fields below | circle-rotation (read), touch-note (read, and write `last_touched`) |
| `log.open-items` | read and write | open-items log | open-items |
| `log.touches` | append | one touch record. Fields below | touch-note (append); circle-rotation (optional read) |
| `household.rhythms` | read and write | one row per rhythm. Fields below | date-night, evening-activities, weekend-with-kids |
| `kb.raw-index` | write | one index row per raw blob | knowledge-intake and the capture skills |
| `kb.wiki` | read and write | curated pages by schema category | knowledge-intake, wiki-ingest |
| `kb.wiki-log` | append | dated ingest log | knowledge-intake, wiki-ingest |
| `kb.positions` | read, and an optional write of confirmed positions | confirmed positions | examine-my-alignment (optional), form-my-point-of-view (optional write) |
| `voice.style-guide` | read; the style-guide skill writes | style guide | thank-you-note (optional). Saved voice skills use the same kind |
| `voice.canon` | read | voice, preferences, about-me, and work-context files | saved voice skills |
| `analytics.product-events` | read | product analytics project | saved analytics skill only. Not in the bstack example |
| `comms.drafts` | write a draft only | review drafts | saved retainer skill only. Not in the bstack example |
| `time.entries` | read | hours per client | saved retainer skill only. Not in the bstack example |
| `tasks.client-work` | read | client task progress | saved retainer skill only. Not in the bstack example |
| `email.locked-drafts` | read only | drafts to copy verbatim | saved retainer skill only, optional. Not in the bstack example |
| `people.partners` | read | partner names and greetings | saved retainer skill only. Not in the bstack example |

Blocks a user does not use are absent. A skill asks only for the entries on its own line.

## Settings

Settings are not sources. They are dotted paths on the top-level objects below.

| Path | Default | Used by |
| --- | --- | --- |
| `workspace.id` | `"personal"` | knowledge-intake routing, keeping state files apart |
| `workspace.root` | `"."` (the folder of `workspace.json`) | every relative path |
| `workspace.timezone` | none; a skill that requires it asks | date windows and due dates. Clocks and cron stay in the host routine |
| `knowledge.raw_dir` | `learnings/raw` | capture skills, wiki-ingest, scripts |
| `knowledge.wiki_dir` | absent | local-wiki mode, only when the user has one |
| `knowledge.wiki_schema` | absent | local-wiki mode, only when the user has one |
| `knowledge.loop_state` | `.agents/loops/knowledge-intake.json` | knowledge-intake and the podcast and YouTube scripts |
| `knowledge.podcast_feeds` | `knowledge/podcast-feeds.json` | capture-podcasts. Path to a workspace-owned file. A missing file is an empty list |
| `knowledge.youtube_channels` | `knowledge/youtube-channels.json` | capture-youtube. Same rule |
| `knowledge.monitored_pages` | `knowledge/monitored-pages.json` | capture-articles. Same rule |
| `knowledge.meeting_lookback` | none; the skill asks | capture-meetings |
| `knowledge.wiki_ingest_skill` | `wiki-ingest` | knowledge-intake |
| `knowledge.guardrails.max_podcast_items_per_run` | `2` | knowledge-intake and scripts |
| `knowledge.guardrails.max_meeting_artifacts_per_run` | `2` | knowledge-intake and scripts |
| `knowledge.guardrails.max_audio_minutes_per_run` | `180` | knowledge-intake and scripts |
| `knowledge.guardrails.max_web_items_per_run` | absent unless set; the example uses `100` | knowledge-intake |
| `knowledge.routing_policy` | accept, reject, and `on_ambiguous` | knowledge-intake, capture-meetings, wiki-ingest |
| `knowledge.schema_categories` | the ten categories in the example | wiki-ingest |
| `knowledge.client_calls_dir` | absent | user file only, when a loop keeps coaching-scope transcripts |
| `knowledge.coaching_client_slugs` | absent | user file only |
| `knowledge.transcription.whisper_cpp_model` | `tools/whisper.cpp/models/ggml-base.en.bin` | transcription scripts |
| `knowledge.transcription.tools_dir` | `tools` | transcription scripts |
| `leadership.coaching_state` | `.agents/loops/coaching-angles.json` | coaching-angles |
| `leadership.coaching_briefs_dir` | `""` means do not save a file | coaching-angles (optional) |
| `relationships.author_lane` | absent | conference-who-to-meet (optional) |
| `relationships.skip_list` | absent | conference-who-to-meet (optional), circle-rotation (optional) |
| `relationships.circle_cadences` | family-outer 21-28 days, friends-inner 14-21, friends-outer 90, professional-inner 30, professional-outer 90-180. The score divides by `min_days`. family-inner is not a key | circle-rotation |
| `relationships.weekly_touches` | `5` | circle-rotation |

Not in `workspace.json`:

- A schedule cadence, a cron expression, or a routine id. The host owns the clock. `workspace.timezone` is the only clock fact here. Touch windows in `relationships.circle_cadences` are settings, not a schedule.
- An `exercises` block. Exercise files are outputs.
- `drafting.work_dir` and `drafting.personal_dir`. Saved drafting skills only. Not in the bstack example.
- `retainer.drafts_dir`, `retainer.outlook_capture_dir`, and `retainer.send_day`. Saved retainer skill only. Not in the bstack example.

## Circle rows and touch entries

`people.circles` is one row per person. `circle` is one of `family-inner`, `family-outer`, `friends-inner`, `friends-outer`, `professional-inner`, `professional-outer`. `status` is `active`, `snoozed`, or `archived`. A missing status means active.

```json
{
  "name": "Example Person",
  "circle": "friends-inner",
  "channel": "text",
  "last_touched": "2026-01-01",
  "cadence_days": null,
  "birthday": "03-14",
  "notes": "",
  "status": "active",
  "snooze_until": null
}
```

`cadence_days` is an optional positive integer. It replaces that person's circle window. `birthday` is `MM-DD` or `YYYY-MM-DD`. `notes` is optional context, including a trigger such as a job change. `channel` is that person's channel preference.

`log.touches` is append-only. `sentiment` is `warm`, `neutral`, or `cooling`.

```json
{
  "date": "2026-01-08",
  "person": "Example Person",
  "channel": "text",
  "talked_about": "a short recap",
  "whats_new": "",
  "promised": "",
  "next_step": "",
  "next_step_date": null,
  "sentiment": "warm"
}
```

A file binding for circles is a JSON array of rows. A file binding for touches is one JSON object per line. Do not rewrite earlier touch lines.

## Household rhythms

`household.rhythms` is one row per rhythm. `type` is `date night`, `weeknight`, or `weekend`. `status` is `active`, `paused`, or `idea`.

```json
{
  "type": "date night",
  "frequency": "twice a month",
  "next_date": "2026-02-06",
  "who": "the couple",
  "status": "active",
  "how_it_went": "",
  "notes": ""
}
```

`frequency` is the cadence in words or a simple interval. `next_date` is `YYYY-MM-DD`. `who` is who the rhythm is for. `how_it_went` is what they reported after the last time. `notes` holds the current plan. A file binding is a JSON array of these rows. Update the matching row in place. Do not name a product. The binding's `via` is the only storage.

## Feed files

`knowledge.podcast_feeds`, `knowledge.youtube_channels`, and `knowledge.monitored_pages` are paths to files the workspace owns. Nothing in the plugin folder is the registry. A missing file means an empty list.

Podcast feeds (`{"feeds": [...]}`):

```json
{
  "feeds": [
    {
      "name": "Example Public Podcast",
      "author": "Example Host",
      "rss_url": "https://example.com/podcast/rss",
      "website": "https://example.com/podcast",
      "active": true,
      "mode": "all_new",
      "initialize_without_backfill": true,
      "exclude_title_patterns": ["trailer", "preview"],
      "max_duration_minutes": 180
    }
  ]
}
```

YouTube channels (`{"channels": [...]}`):

```json
{
  "channels": [
    {
      "name": "Example Channel",
      "channel_id": "UCxxxxxxxxxxxxxxxxxxxxxx",
      "rss_url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxxxxxxxxxxxxxxxxxxx",
      "active": true,
      "initialize_without_backfill": true
    }
  ]
}
```

`knowledge.monitored_pages` points at a workspace-owned file (default `knowledge/monitored-pages.json`). A missing file means an empty list. capture-articles still treats queued article URLs as run input until that skill is migrated, so this repo does not lock a page-entry schema yet.

## Alias table

Check the v2 path first. If it is missing, the old flat field still counts. When a skill writes, it writes the v2 shape and deletes the old key. Leave sibling keys in place. Old files keep working until something writes them.

`people.circles`, `log.touches`, `household.rhythms`, `relationships.circle_cadences`, and `relationships.weekly_touches` are new. They have no old field.

| Old field | New home |
| --- | --- |
| `workspace_id` | `workspace.id` |
| `workspace_root` | `workspace.root` |
| `inbox_source` | `sources["email.inbox"]` |
| `slack_source` | `sources["chat.messages"]` (optional) |
| `priorities_source` | `sources["tasks.priorities"]` |
| `calendar_source` | `sources["calendar.events"]` |
| `agent_queue_source` | `sources["tasks.agent-queue"]` |
| `week_snapshot_source` | `sources["tasks.week-snapshot"]` |
| `work_queue_source` | `sources["tasks.work-queue"]` |
| `newsletter_sources` | `sources["email.newsletters"]` |
| `notion_raw_db` `{name,id}` | `sources["kb.raw-index"]` as `{ "via": "connector", "connector": "<server>", "target": "<id>", "name": "<name>" }` |
| `notion_wiki_db` | `sources["kb.wiki"]` |
| `notion_wiki_log` | `sources["kb.wiki-log"]` |
| `raw_dir` | `knowledge.raw_dir` |
| `loop_state` | `knowledge.loop_state` |
| `podcast_feeds` (a path) | `knowledge.podcast_feeds` (a path to a workspace-owned file, not a list inlined into `workspace.json`) |
| `youtube_channels` (a path) | `knowledge.youtube_channels` (same) |
| `meeting_lookback` | `knowledge.meeting_lookback` |
| `wiki_ingest_skill` | `knowledge.wiki_ingest_skill` |
| `guardrails` | `knowledge.guardrails` |
| `routing_policy` | `knowledge.routing_policy` |
| `schema_categories` | `knowledge.schema_categories` |
| `wiki_dir`, `wiki_schema`, `monitored_pages`, `client_calls_dir`, `coaching_client_slugs` | the same names under `knowledge` |
| a loop spec's `guardrails.max_meeting_items_per_run` | `knowledge.guardrails.max_meeting_artifacts_per_run` |
| a loop spec's `guardrails.max_web_items_per_run` | `knowledge.guardrails.max_web_items_per_run` |
| a loop spec's `timezone` | `workspace.timezone` |
| a loop spec's `cadence`, `proposed_schedule`, `scheduled_task_id` | the host routine only. Not in `workspace.json` |
| a loop spec's `state_ref` | `knowledge.loop_state` |
| `leadership.transcripts_source` | `sources["transcripts.meetings"]` |
| `leadership.skill_assessment_source` | `sources["people.assessments"]` |
| `leadership.team_roster` | `sources["people.roster"]` |
| `leadership.disc_source` | `sources["people.profiles"]` |
| `leadership.one_on_one_history_source` | `sources["transcripts.one-on-ones"]` |
| `leadership.open_items_log` | `sources["log.open-items"]` |
| `leadership.open_items_read_sources` (list) | `sources["tasks.commitments"]` (list) |
| `leadership.coaching_state` | `leadership.coaching_state` |
| `leadership.coaching_briefs_dir` | `leadership.coaching_briefs_dir` |
| `context/style-guide.md` as a fixed path | `sources["voice.style-guide"]` |
| fixed voice-canon paths, or voice paths remembered by the host | `sources["voice.canon"]` and `sources["voice.style-guide"]` |
| a remembered author lane or skip list | `relationships.author_lane`, `relationships.skip_list` |

Per-call arguments such as a date range, a person filter, or an output mode are not config and have no alias.

Read an old string with these rules. The literal `paste` is `{ "via": "paste" }`. Any other filled string is `{ "via": "connector", "target": "<that string>" }`. A list of filled strings is a list of those bindings. An empty string on an optional kind is `{ "via": "none" }`.

Environment variables are not config. Scripts take `--config`. If that flag is omitted, they walk upward from the working directory until they find `workspace.json`. The old name `KNOWLEDGE_WORKSPACE_ROOT` meant the folder of that file. The old name `WHISPER_CPP_MODEL` meant `knowledge.transcription.whisper_cpp_model`. Do not add either variable back.

## Secrets

Secrets never go in `workspace.json`, the example, or a skill file.

Prefer the host's connector auth. If a script needs a raw key, `workspace.json` may hold only the name of an environment variable:

```json
"secrets": {
  "rss_proxy": { "env": "RSS_PROXY_TOKEN", "used_by": ["capture-podcasts"] }
}
```

The value is set in the host environment. A skill does not write it. No skill in this repo needs a secret today. `.env` and `.env.*` stay in `.gitignore` as a guard only.

## Config check

Paste this at the top of every skill that declares `bstack-config`. Do not paraphrase it. A short paragraph after it may say how that skill treats an optional entry.

```markdown
## Config check

Do this before any other step. Find `workspace.json`: the path the caller gave, else the active workspace root, else ask once. Read this skill's `bstack-config` line in the frontmatter. For each required source kind look up `sources.<kind>`; for each required setting look up its dotted path. If an entry is absent, empty, or starts with `REPLACE_WITH` (including inside nested objects and lists), ask only for that entry, write it into `workspace.json` in the v2 shape, and continue. Entries marked `?` that are absent or `"via": "none"` are skipped without asking. If a source is bound to a connector this host does not have, stop and say "`<kind>` is bound to `<connector>`, which is not connected here." Do not swap in another tool, a cached copy, or a guess. Old flat field names still count through the alias table in SOURCES.md. Do not run a full onboarding interview.
```

## Scripts

Knowledge-intake scripts read this file. Pass `--config path/to/workspace.json`, or run them from the workspace so they can walk upward to it. Relative paths resolve from the workspace root. `--raw-dir`, `--registry`, `--state`, `--max-items`, `--max-audio-minutes`, and `--whisper-cpp-model` override one run. They are not a second config.

`knowledge.podcast_feeds` and `knowledge.youtube_channels` name workspace-owned files. A missing file is an empty list. Nothing in the plugin folder is a registry.
