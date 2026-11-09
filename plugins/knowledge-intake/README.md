# knowledge-intake (bstack plugin)

Portable knowledge capture and wiki ingest skills. The knowledge base is `kb.raw-index`, `kb.wiki`, and `kb.wiki-log`. A connector such as Notion is one way to bind those kinds. The binding lives in `workspace.json`.

Install from **[bradcerb/bstack](https://github.com/bradcerb/bstack)** under `plugins/knowledge-intake/`. The older standalone repo [bradcerb/knowledge-intake-skills](https://github.com/bradcerb/knowledge-intake-skills) remains usable; prefer this path for new installs.

See the root [ARCHITECTURE.md](../../ARCHITECTURE.md). Config is one file: copy the repo [examples/workspace.json.example](../../examples/workspace.json.example) to `workspace.json` where you run skills. Kinds, settings, aliases, and the podcast and YouTube feed-file shapes are in [SOURCES.md](../../SOURCES.md). This plugin does not ship a second example.

Scripts take `--config` pointing at that file. If the flag is omitted they walk upward from the working directory. The workspace root is the folder that holds `workspace.json`. Feed and channel lists are workspace-owned files named by `knowledge.podcast_feeds` and `knowledge.youtube_channels`. A missing file is an empty list. CLI flags override one run and are not stored.

## Library hosts

All seven skills have a runtime path for hosts without files or shell. They read the host profile and the Knowledge runtime bindings contract in the root `SOURCES.md`. The existing file and Python workflows remain the path for workspace hosts without a runtime binding.

Start from `examples/bstack-library-host.json.example` at the repo root. Use actual tools exposed by the host, not the example names. The host enforces approvals, data boundaries, paid transcription consent, and storage semantics. This plugin defines procedures; it does not install a database or a transcription service.

| Skill | Runtime inputs | Durable output |
| --- | --- | --- |
| `capture-articles` | Submitted URLs or an approved article queue; full fetch or caller-supplied body | Complete private article record |
| `capture-newsletters` | Approved newsletter binding or submitted issues | Complete private issue record; per-source cursor when bound |
| `capture-podcasts` | Submitted episodes or bound feed list; publisher or audio-derived transcript | Show notes and transcript with provenance |
| `capture-youtube` | Submitted videos or bound channels; audio-derived transcript | Transcript with provenance; platform captions alone are deferred |
| `capture-meetings` | Authorized calendar artifacts or provider transcripts; optional audio transcription | Private meeting record; raw and both output modes also work without Python |
| `wiki-ingest` | Full saved records through a read binding, or supplied complete raw records | Verified wiki pages and idempotent log entries, with source citations |
| `knowledge-intake` | Explicit batch or bound monitored sources; state lease for scheduled discovery | Capture receipts, verified ingest, and conditional state checkpoints |

The raw save tool receives one record containing the existing frontmatter fields plus the full Markdown `body`, without `raw_path`. It upserts by source type and external id and returns a durable id, preferably with an immutable version. A separate `kb.raw-content` read binding supports verification and ingest, so the capture module can stay separate from a read-only librarian. A save-only tool remains usable for capture.

Scheduled monitoring needs workspace-scoped state with atomic compare-and-set and expiring ownership. Pending capture failures and saved records awaiting ingest survive retries. Without that state binding, explicit one-off captures still work and report that state was not saved; scheduled discovery is deferred. Missing transcription defers the item without marking it handled. Missing write bindings produce proposals and report zero saves. The host profile is never changed.

Bind `kb.wiki` and `kb.wiki-log` only when HomeOS should maintain a curated wiki. A library-only deployment can capture and retrieve raw records without them; it reports capture-only rather than a completed wiki cycle. Synthesis requires full reads and idempotent page/log writes. Tool schemas that lack those operations are reported, not guessed.

## Verification

Run the existing meeting parameter tests with Python unittest discovery. `node scripts/eval-knowledge-runtime.mjs` installs all seven skills into a temporary Codex project and runs fixture-backed host evaluations with shell tools disabled. It requires a signed-in Codex CLI. The fixture services use synthetic records and never call live external APIs. The eval checks capture writes, transcription deferral, meeting output modes, wiki receipts, state failure recovery, and refusal of unsupported scheduled state.
