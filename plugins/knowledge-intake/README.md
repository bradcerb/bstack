# knowledge-intake (bstack plugin)

Portable knowledge capture and wiki ingest skills. The knowledge base is `kb.raw-index`, `kb.wiki`, and `kb.wiki-log`. A connector such as Notion is one way to bind those kinds. The binding lives in `workspace.json`.

Install from **[bradcerb/bstack](https://github.com/bradcerb/bstack)** under `plugins/knowledge-intake/`. The older standalone repo [bradcerb/knowledge-intake-skills](https://github.com/bradcerb/knowledge-intake-skills) remains usable; prefer this path for new installs.

See the root [ARCHITECTURE.md](../../ARCHITECTURE.md). Config is one file: copy the repo [examples/workspace.json.example](../../examples/workspace.json.example) to `workspace.json` where you run skills. Kinds, settings, aliases, and the podcast and YouTube feed-file shapes are in [SOURCES.md](../../SOURCES.md). This plugin does not ship a second example.

Scripts take `--config` pointing at that file. If the flag is omitted they walk upward from the working directory. The workspace root is the folder that holds `workspace.json`. Feed and channel lists are workspace-owned files named by `knowledge.podcast_feeds` and `knowledge.youtube_channels`. A missing file is an empty list. CLI flags override one run and are not stored.
