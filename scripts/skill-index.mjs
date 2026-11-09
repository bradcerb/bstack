#!/usr/bin/env node
// Prints one JSON row per skill with its portability metadata, so a consumer can filter an allowlist.
// `node scripts/skill-index.mjs` prints every row. repo-lint imports readSkills and PORTABILITY to check them.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

export const PORTABILITY = {
  "bstack-needs": /^(none|((shell|files|web|browser)\??)( (shell|files|web|browser)\??)*)$/,
  "bstack-sends": /^(yes|no)$/,
  "bstack-money": /^(yes|no)$/,
  "bstack-scope": /^(personal|work|any)$/,
};

export function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return null;
  const top = {};
  const metadata = {};
  let block = null;
  for (const line of m[1].split("\n")) {
    const key = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (key) {
      block = key[1];
      if (key[2] && key[2] !== ">-" && key[2] !== "|") top[block] = unquote(key[2]);
      continue;
    }
    const nested = line.match(/^ {2}([A-Za-z][\w-]*):\s*(.*)$/);
    if (block === "metadata" && nested) metadata[nested[1]] = unquote(nested[2]);
    else if (block && line.startsWith("  ") && block !== "metadata") top[block] = `${top[block] ?? ""} ${line.trim()}`.trim();
  }
  return { ...top, metadata };
}

const unquote = (s) => s.replace(/^"(.*)"$/, "$1");
const tokens = (s) => (s ?? "").split(" ").filter((t) => t && t !== "none");

export function readSkills() {
  const plugins = join(root, "plugins");
  return readdirSync(plugins).sort().flatMap((plugin) => {
    const dir = join(plugins, plugin, "skills");
    if (!existsSync(dir)) return [];
    return readdirSync(dir).sort().filter((s) => existsSync(join(dir, s, "SKILL.md"))).map((skill) => {
      const path = join(dir, skill, "SKILL.md");
      const fm = frontmatter(readFileSync(path, "utf8")) ?? { metadata: {} };
      return { plugin, skill, path: relative(root, path), name: fm.name, metadata: fm.metadata };
    });
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = readSkills().map(({ plugin, skill, path, metadata }) => ({
    plugin,
    skill,
    path,
    needs: tokens(metadata["bstack-needs"]).filter((t) => !t.endsWith("?")),
    optional: tokens(metadata["bstack-needs"]).filter((t) => t.endsWith("?")).map((t) => t.slice(0, -1)),
    sends: metadata["bstack-sends"] === "yes",
    money: metadata["bstack-money"] === "yes",
    scope: metadata["bstack-scope"],
    config: metadata["bstack-config"] ?? null,
  }));
  console.log(JSON.stringify(rows, null, 2));
}
