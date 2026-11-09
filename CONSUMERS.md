# Consumers

How a downstream repo vendors a chosen set of bstack skills, pins a version, and takes updates through pull requests. A consumer copies skills verbatim. It does not edit them. A fix goes to bstack, then arrives through the next update.

## Pick an allowlist

`node scripts/skill-index.mjs` prints every skill with its portability fields (`needs`, `optional`, `sends`, `money`, `scope`). The values are defined under Portability in [SOURCES.md](./SOURCES.md). Choose plugins or single skills from that list.

`scripts/vendor.mjs` refuses a skill the host cannot run:

- a required `bstack-needs` token that is not in `--capabilities`
- `bstack-sends: "yes"`, unless you pass `--allow-sends`
- `bstack-scope: "work"`, unless you pass `--allow-work`
- a Markdown link that leaves the skill's own folder, because the vendored copy would point at nothing

Money is not refused. Put a money skill on the allowlist only when the host should have it.

Prefer naming skills (`relationships/touch-note`) over whole plugins. A plugin name also takes skills added to it later, and a new skill the host cannot run makes the whole update fail.

## Vendor the skills

Run the script from a bstack checkout at the commit you pin:

```sh
git clone --depth 1 --branch v0.1.0 https://github.com/bradcerb/bstack /tmp/bstack
node /tmp/bstack/scripts/vendor.mjs --out agent/skills/bstack --allow thinking,relationships,household --capabilities web
```

The output is a dedicated directory. The script refuses symlinks in the output path or tree, hard-linked output files, tracked source symlinks, invalid lock paths, and unmanaged skill-folder collisions before copying. Relative Markdown links with HTML entities or backslash escapes are unsupported and refused. Standard macOS temporary-directory aliases resolve to their fixed system paths. It copies the committed regular files in each skill folder, unchanged, copies `SOURCES.md` next to them, and writes `bstack.lock.json` with the tag, the commit, and the flags it ran with. It removes skills that an earlier run vendored and this allowlist drops. It refuses to run from a bstack checkout with uncommitted changes.

Check that nobody edited a vendored file by vendoring again from the locked commit and comparing:

```sh
L=agent/skills/bstack/bstack.lock.json
git clone https://github.com/bradcerb/bstack /tmp/bstack && git -C /tmp/bstack checkout "$(jq -r .commit $L)"
node /tmp/bstack/scripts/vendor.mjs --out /tmp/fresh --allow "$(jq -r '.allow | join(",")' $L)" \
  --capabilities "$(jq -r '.capabilities | join(",")' $L)" $(jq -r 'if .allow_sends then "--allow-sends" else "" end, if .allow_work then "--allow-work" else "" end' $L)
diff -r /tmp/fresh agent/skills/bstack
```

Any difference, including an added file, fails the check.

Skills cite `SOURCES.md` for row shapes, defaults, and the alias table. Make the vendored copy readable to the agent the same way the skills are.

## Write a host profile

A host with no writable workspace commits a host profile. The format is under Host profile in [SOURCES.md](./SOURCES.md). The host loads it into the agent's instructions, or ships it as `bstack-host.json` where the agent can read it. Skills read it first and never write it.

A runtime agent with web fetch, no shell, no files, a library tool, and a reminders tool might commit this:

```json
{
  "bstack_host_version": 1,
  "host": { "name": "homeos", "capabilities": ["web"] },
  "workspace": { "timezone": "America/Chicago" },
  "sources": {
    "household.rhythms": { "via": "tool", "tool": "household_rhythms" },
    "tasks.commitments": [{ "via": "tool", "tool": "reminders" }],
    "people.circles": { "via": "tool", "tool": "circles" },
    "log.touches": { "via": "tool", "tool": "touches" },
    "kb.positions": { "via": "tool", "tool": "positions" },
    "calendar.events": { "via": "connector", "connector": "google-calendar", "target": "primary" },
    "voice.style-guide": { "via": "none" }
  },
  "relationships": { "weekly_touches": 5 }
}
```

Each tool name is one the host exposes. A kind that is read and written binds to one tool that does both. A required kind the profile leaves out acts as `paste`: the skill asks in the conversation and returns what it would have written. Bind only what the host really stores.

`circle-rotation` boosts people with an open promise or a recent touch only when it can read `tasks.commitments` and `log.touches`. A write-only tool there makes it skip those boosts.

## Pin a version

Pin a tag. Never pin a branch.

- Tags are `vMAJOR.MINOR.PATCH` on `main`.
- MAJOR changes the config-check text in a way a host must react to, removes or renames a source kind, a binding, a setting, or a metadata key, changes a row shape, or makes a skill's portability stricter (a new required `bstack-needs` token, `bstack-sends` to `yes`, or `bstack-scope` to `work`).
- MINOR adds a skill, a kind, a binding, a setting, or a metadata value.
- PATCH changes wording or a script fix that keeps every shape.
- Until a tag covers what you need, pin a full commit SHA from `main`. A SHA from an open pull request can vanish when it merges by squash.

`bstack.lock.json` records which one you pinned.

## Take updates through pull requests

A weekly job in the consumer repo checks for a newer tag, re-vendors the same allowlist, and opens a pull request. A human reviews the diff and merges. The job never merges.

```yaml
name: bstack-update
on:
  schedule: [{ cron: "0 14 * * 1" }]
  workflow_dispatch:
permissions: { contents: write, pull-requests: write }
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - name: Find the newest tag
        id: tag
        run: |
          tag=$(git ls-remote --tags --refs https://github.com/bradcerb/bstack 'v*' | sed 's|.*refs/tags/||' \
            | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1)
          echo "tag=$tag" >> "$GITHUB_OUTPUT"
      - name: Re-vendor
        run: |
          git clone --depth 1 --branch "${{ steps.tag.outputs.tag }}" https://github.com/bradcerb/bstack /tmp/bstack
          L=agent/skills/bstack/bstack.lock.json
          node /tmp/bstack/scripts/vendor.mjs --out agent/skills/bstack --allow "$(jq -r '.allow | join(",")' $L)" \
            --capabilities "$(jq -r '.capabilities | join(",")' $L)" $(jq -r 'if .allow_sends then "--allow-sends" else "" end, if .allow_work then "--allow-work" else "" end' $L)
      - uses: peter-evans/create-pull-request@v7
        with:
          branch: bstack/${{ steps.tag.outputs.tag }}
          title: "chore(skills): update bstack to ${{ steps.tag.outputs.tag }}"
          body: "Re-vendored the same allowlist from bstack ${{ steps.tag.outputs.tag }}. Read the bstack release notes for MAJOR changes before merging."
```

When nothing changed, the job opens no pull request. Run the re-vendor check above in the consumer's own CI, so a hand edit fails before review.

Two GitHub settings matter. The repo must allow GitHub Actions to create pull requests. A pull request opened with the default `GITHUB_TOKEN` does not start other workflows, so pass a fine-grained token or a GitHub App token to `create-pull-request` if the update PR should run the consumer's CI.
