#!/usr/bin/env node
// Copies an allowlist of skills, verbatim, into a consumer repo and records a lock file with a hash per file.
//   node scripts/vendor.mjs --out <dir> --allow thinking,relationships/touch-note [--capabilities web] [--allow-sends] [--allow-work]
//   node scripts/vendor.mjs --out <dir> --check     (run from anywhere; fails when a vendored file differs from the lock)
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { parseArgs } from "node:util";
import { readSkills, root } from "./skill-index.mjs";

const { values: args } = parseArgs({
  options: {
    out: { type: "string" },
    allow: { type: "string", default: "" },
    capabilities: { type: "string", default: "" },
    "allow-sends": { type: "boolean", default: false },
    "allow-work": { type: "boolean", default: false },
    check: { type: "boolean", default: false },
  },
});
if (!args.out) fail("--out is required");
const LOCK = join(args.out, "bstack.lock.json");
const list = (s) => s.split(",").map((t) => t.trim()).filter(Boolean);
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));

function fail(msg) {
  console.error(`vendor: ${msg}`);
  process.exit(1);
}

if (args.check) {
  if (!existsSync(LOCK)) fail(`no ${LOCK}`);
  const lock = JSON.parse(readFileSync(LOCK, "utf8"));
  const bad = Object.entries(lock.files).filter(([f, h]) => !existsSync(join(args.out, f)) || sha(join(args.out, f)) !== h);
  const tracked = new Set(Object.keys(lock.files));
  const extra = lock.skills.flatMap((s) => walk(join(args.out, s))).map((p) => relative(args.out, p)).filter((f) => !tracked.has(f));
  for (const f of bad) console.error(`vendor: ${f[0]} differs from bstack ${lock.commit}`);
  for (const f of extra) console.error(`vendor: ${f} is not from bstack ${lock.commit}`);
  if (bad.length || extra.length) process.exit(1);
  console.log(`vendor: ok (${lock.skills.length} skills at ${lock.commit})`);
  process.exit(0);
}

const allow = list(args.allow);
if (!allow.length) fail("--allow names at least one plugin or plugin/skill");
const capabilities = new Set(list(args.capabilities));
const all = readSkills();
const picked = all.filter((s) => allow.includes(s.plugin) || allow.includes(`${s.plugin}/${s.skill}`));
for (const a of allow) if (!all.some((s) => a === s.plugin || a === `${s.plugin}/${s.skill}`)) fail(`"${a}" is not a plugin or plugin/skill in bstack`);

const refused = picked.flatMap((s) => {
  const needs = (s.metadata["bstack-needs"] ?? "").split(" ").filter((t) => t && t !== "none" && !t.endsWith("?"));
  const why = [];
  const missing = needs.filter((t) => !capabilities.has(t));
  if (missing.length) why.push(`needs ${missing.join(" ")}`);
  if (s.metadata["bstack-sends"] === "yes" && !args["allow-sends"]) why.push("sends (pass --allow-sends)");
  if (s.metadata["bstack-scope"] === "work" && !args["allow-work"]) why.push("work scope (pass --allow-work)");
  return why.length ? [`${s.plugin}/${s.skill}: ${why.join("; ")}`] : [];
});
if (refused.length) fail(`refused:\n  ${refused.join("\n  ")}`);

const dirty = execFileSync("git", ["status", "--porcelain", "--", "plugins", "SOURCES.md"], { cwd: root, encoding: "utf8" }).trim();
if (dirty) fail(`bstack has uncommitted changes, so the lock would name the wrong commit:\n${dirty}`);

const previous = existsSync(LOCK) ? JSON.parse(readFileSync(LOCK, "utf8")).skills : [];
for (const s of previous) rmSync(join(args.out, s), { recursive: true, force: true });
mkdirSync(args.out, { recursive: true });
for (const s of picked) cpSync(join(root, "plugins", s.plugin, "skills", s.skill), join(args.out, s.skill), { recursive: true });
cpSync(join(root, "SOURCES.md"), join(args.out, "SOURCES.md"));

const files = Object.fromEntries(
  ["SOURCES.md", ...picked.flatMap((s) => walk(join(args.out, s.skill)).map((p) => relative(args.out, p)))].sort().map((f) => [f, sha(join(args.out, f))]),
);
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const tag = execFileSync("git", ["tag", "--points-at", "HEAD"], { cwd: root, encoding: "utf8" }).trim().split("\n")[0] || null;
writeFileSync(LOCK, `${JSON.stringify({ repo: "bradcerb/bstack", tag, commit, allow, skills: picked.map((s) => s.skill), files }, null, 2)}\n`);
console.log(`vendor: ${picked.length} skills from ${tag ?? commit} into ${args.out}`);
