# Knowledge intake portability

This reference describes the file-host workflow. On runtime hosts use the Runtime path in SKILL.md and Knowledge runtime bindings in SOURCES.md. Never bootstrap local tools or open workspace files on that path.

Each skill owns its deterministic scripts and supporting references. Machine-level programs such as ffmpeg and Python environments are dependencies, not workspace tools.

## Portability

Keep skill names and scripts workspace-neutral. Each workspace supplies its own `workspace.json`. Kinds, settings, the feed files, `knowledge.loop_state`, `knowledge.routing_policy`, and the wiki-ingest skill name all live there. Relative paths resolve from `workspace.root`.

For a second workspace, use a distinct `workspace.id`, its own `knowledge.raw_dir`, its own `kb.*` bindings, and a routing policy that rejects the other boundary. Never share state files or raw output directories between workspaces.

## Runtime data

- Store durable cursors at `knowledge.loop_state`.
- Store temporary audio outside the wiki and delete it only after a transcript is verified.
- Keep secrets out of the workspace file. Use host connector auth or the host secret store.
- A workspace Python environment may live at `.venv/` and should stay ignored by version control.
- Install ffmpeg with the machine package manager. Install the local transcriber into the workspace tools directory from `knowledge.transcription.tools_dir`.
