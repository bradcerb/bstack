# knowledge-intake (bstack plugin)

Portable knowledge capture and wiki ingest skills. The knowledge base is `kb.raw-index`, `kb.wiki`, and `kb.wiki-log`. A connector such as Notion is one way to bind those kinds. The binding lives in `workspace.json`.

Install from **[bradcerb/bstack](https://github.com/bradcerb/bstack)** under `plugins/knowledge-intake/`. The older standalone repo [bradcerb/knowledge-intake-skills](https://github.com/bradcerb/knowledge-intake-skills) remains usable; prefer this path for new installs.

See the root [ARCHITECTURE.md](../../ARCHITECTURE.md). Config is one file: copy the repo [examples/workspace.json.example](../../examples/workspace.json.example) to `workspace.json` where you run skills. Kinds, settings, aliases, and the podcast and YouTube feed-file shapes are in [SOURCES.md](../../SOURCES.md). This plugin does not ship a second example.

Scripts take `--config` pointing at that file. If the flag is omitted they walk upward from the working directory. The workspace root is the folder that holds `workspace.json`. Feed and channel lists are workspace-owned files named by `knowledge.podcast_feeds` and `knowledge.youtube_channels`. A missing file is an empty list. CLI flags override one run and are not stored.

## Library hosts

A library host stores knowledge through a save tool instead of raw files, and has no shell. To save articles, its host profile binds `kb.raw-index` to that tool and lists `web` in `host.capabilities`. Without a binding, `capture-articles` returns the prepared raw record in the conversation and reports that nothing was saved.

The save tool's contract:

- It takes one raw record: the frontmatter fields the capture skill builds, plus `body` (the Markdown) and `status`.
- It upserts by `external_id`, so a second capture of the same URL updates one record.
- It returns the record's id.

| Skill | On a library host | What it still needs |
| --- | --- | --- |
| `capture-articles` | Runs for a submitted URL. The tool stores the record. The browser fallback is skipped when `browser` is not listed. | Nothing more |
| `capture-newsletters` | Not yet | The same tool path as `capture-articles`, and a home for its cursor. `knowledge.loop_state` is a file. A future `state.loop` kind bound to a key-value tool would replace it. |
| `capture-podcasts`, `capture-youtube` | No | `shell` and local transcription. A publisher-transcript-only path for podcasts could drop the shell later. |
| `capture-meetings` | No | `shell` (`meeting_params.py`) and `knowledge.loop_state` |
| `wiki-ingest`, `knowledge-intake` | No | A wiki (`kb.wiki`, `kb.wiki-log`) and raw files. A library host answers from the library instead. |

A profile for `capture-articles` binds one source:

```json
"kb.raw-index": { "via": "tool", "tool": "library_save" }
```

`knowledge.raw_dir` stays at its default and is never read. A fileless host skips the optional monitored-pages file and takes URLs submitted for the run.
