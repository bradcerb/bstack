# knowledge-intake (bstack plugin)

Portable Notion-first knowledge capture and wiki ingest skills.

Install from **[bradcerb/bstack](https://github.com/bradcerb/bstack)** under `plugins/knowledge-intake/`. The older standalone repo [bradcerb/knowledge-intake-skills](https://github.com/bradcerb/knowledge-intake-skills) remains usable; prefer this path for new installs.

See the root [ARCHITECTURE.md](../../ARCHITECTURE.md). Config is one file: copy the repo [examples/workspace.json.example](../../examples/workspace.json.example) to `workspace.json` where you run skills. Kinds, settings, aliases, and the podcast and YouTube feed-file shapes are in [SOURCES.md](../../SOURCES.md). This plugin does not ship a second example.

The skills in this plugin still read the older flat field names. Those names alias to the v2 homes in SOURCES.md. The skill and script rewrite is the next change. Until then, `skills/knowledge-intake/references/workspace.json` is a marker the scripts look for. It is not config. Do not put values there.
