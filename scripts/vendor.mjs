#!/usr/bin/env node
// Copies an allowlist of skills, verbatim, into a consumer repo and records what it copied in bstack.lock.json.
//   node scripts/vendor.mjs --out <dir> --allow thinking,relationships/touch-note [--capabilities web] [--allow-sends] [--allow-work]
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { readSkills, root } from "./skill-index.mjs";

const { values: args } = parseArgs({
  options: {
    out: { type: "string" },
    allow: { type: "string", default: "" },
    capabilities: { type: "string", default: "" },
    "allow-sends": { type: "boolean", default: false },
    "allow-work": { type: "boolean", default: false },
  },
});
const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8" }).trim();
const list = (s) => s.split(",").map((t) => t.trim()).filter(Boolean);
function fail(msg) {
  console.error(`vendor: ${msg}`);
  process.exit(1);
}

if (!args.out) fail("--out is required");
const allow = list(args.allow);
if (!allow.length) fail("--allow names at least one plugin or plugin/skill");
const capabilities = new Set(list(args.capabilities));
const all = readSkills();
for (const a of allow) if (!all.some((s) => a === s.plugin || a === `${s.plugin}/${s.skill}`)) fail(`"${a}" is not a plugin or plugin/skill in bstack`);
const picked = all.filter((s) => allow.includes(s.plugin) || allow.includes(`${s.plugin}/${s.skill}`));

const dupes = picked.map((s) => s.skill).filter((n, i, a) => a.indexOf(n) !== i);
if (dupes.length) fail(`two plugins ship a skill named ${dupes.join(", ")}`);

const dirty = git("status", "--porcelain", "--", "plugins", "SOURCES.md");
if (dirty) fail(`bstack has uncommitted changes, so the lock would name the wrong commit:\n${dirty}`);

const filesOf = (s) => git("ls-files", "--", `plugins/${s.plugin}/skills/${s.skill}`).split("\n").filter(Boolean);
const refused = picked.flatMap((s) => {
  const needs = (s.metadata["bstack-needs"] ?? "").split(" ").filter((t) => t && t !== "none" && !t.endsWith("?"));
  const why = [];
  const missing = needs.filter((t) => !capabilities.has(t));
  if (missing.length) why.push(`needs ${missing.join(" ")}`);
  if (s.metadata["bstack-sends"] === "yes" && !args["allow-sends"]) why.push("sends (pass --allow-sends)");
  if (s.metadata["bstack-scope"] === "work" && !args["allow-work"]) why.push("work scope (pass --allow-work)");
  const dir = join(root, "plugins", s.plugin, "skills", s.skill);
  for (const f of filesOf(s).filter((f) => f.endsWith(".md"))) {
    for (const [, target] of readFileSync(join(root, f), "utf8").matchAll(/\]\(([^)#\s]+)/g)) {
      if (/^[a-z]+:/i.test(target)) continue;
      if (relative(dir, resolve(dirname(join(root, f)), target)).startsWith("..")) why.push(`links outside its folder (${target})`);
    }
  }
  return why.length ? [`${s.plugin}/${s.skill}: ${why.join("; ")}`] : [];
});
if (refused.length) fail(`refused:\n  ${refused.join("\n  ")}`);

const LOCK = join(args.out, "bstack.lock.json");
const previous = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")).skills : [];
for (const s of previous) rmSync(join(args.out, s), { recursive: true, force: true });
for (const s of picked) {
  const base = `plugins/${s.plugin}/skills/${s.skill}`;
  for (const f of filesOf(s)) {
    const to = join(args.out, s.skill, relative(base, f));
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(join(root, f), to);
  }
}
copyFileSync(join(root, "SOURCES.md"), join(args.out, "SOURCES.md"));

const commit = git("rev-parse", "HEAD");
const tag = git("tag", "--points-at", "HEAD").split("\n").filter(Boolean).sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))[0] ?? null;
const lock = {
  repo: "bradcerb/bstack",
  tag,
  commit,
  allow,
  capabilities: [...capabilities],
  allow_sends: args["allow-sends"],
  allow_work: args["allow-work"],
  skills: picked.map((s) => s.skill),
};
writeFileSync(LOCK, `${JSON.stringify(lock, null, 2)}\n`);
console.log(`vendor: ${picked.length} skills from ${tag ?? commit} into ${args.out}`);
