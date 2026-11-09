#!/usr/bin/env node
// Copies an allowlist of skills, verbatim, into a consumer repo and records what it copied in bstack.lock.json.
//   node scripts/vendor.mjs --out <dir> --allow thinking,relationships/touch-note [--capabilities web] [--allow-sends] [--allow-work]
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
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
args.out = resolve(args.out);
// macOS exposes its temporary directories through fixed system aliases.
if (process.platform === "darwin") {
  for (const [alias, canonical] of [["/tmp", "/private/tmp"], ["/var", "/private/var"]]) {
    if ((args.out === alias || args.out.startsWith(`${alias}/`)) && realpathSync(alias) === canonical) args.out = canonical + args.out.slice(alias.length);
  }
}
for (let path = args.out; ; path = dirname(path)) {
  let stat;
  try { stat = lstatSync(path); } catch (error) { if (error.code !== "ENOENT") throw error; }
  if (stat?.isSymbolicLink()) fail(`output path contains a symlink: ${path}`);
  if (path === dirname(path)) break;
}
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

const filesOf = (s) => git("ls-files", "-z", "--", `plugins/${s.plugin}/skills/${s.skill}`).split("\0").filter(Boolean);
for (const s of picked) {
  const entries = git("ls-files", "--stage", "-z", "--", `plugins/${s.plugin}/skills/${s.skill}`).split("\0").filter(Boolean);
  if (entries.some((entry) => !/^100(644|755) /.test(entry))) fail(`${s.plugin}/${s.skill}: only regular tracked files can be vendored`);
}
const refused = picked.flatMap((s) => {
  const needs = (s.metadata["bstack-needs"] ?? "").split(" ").filter((t) => t && t !== "none" && !t.endsWith("?"));
  const why = [];
  const missing = needs.filter((t) => !capabilities.has(t));
  if (missing.length) why.push(`needs ${missing.join(" ")}`);
  if (s.metadata["bstack-sends"] === "yes" && !args["allow-sends"]) why.push("sends (pass --allow-sends)");
  if (s.metadata["bstack-scope"] === "work" && !args["allow-work"]) why.push("work scope (pass --allow-work)");
  const dir = join(root, "plugins", s.plugin, "skills", s.skill);
  for (const f of filesOf(s).filter((f) => f.endsWith(".md"))) {
    const text = readFileSync(join(root, f), "utf8");
    const links = [...text.matchAll(/\]\(\s*(?:<([^>]+)>|([^\s)#]+))/g), ...text.matchAll(/^ {0,3}\[[^\]]+\]:\s*(?:<([^>]+)>|(\S+))/gm)];
    for (const match of links) {
      const target = match[1] ?? match[2];
      if (/^(https?|mailto|data):/i.test(target) || target.startsWith("#")) continue;
      if (/[&\\]/.test(target)) { why.push(`unsupported escaped local link (${target})`); continue; }
      let path;
      try { path = decodeURIComponent(target.split("#")[0]); } catch { why.push(`invalid link (${target})`); continue; }
      const rel = relative(dir, resolve(dirname(join(root, f)), path));
      if (rel === ".." || rel.startsWith("../") || /^[a-z]+:/i.test(path)) why.push(`links outside its folder (${target})`);
    }
  }
  return why.length ? [`${s.plugin}/${s.skill}: ${why.join("; ")}`] : [];
});
if (refused.length) fail(`refused:\n  ${refused.join("\n  ")}`);

const LOCK = join(args.out, "bstack.lock.json");
function refuseSymlinks(path) {
  let stat;
  try { stat = lstatSync(path); } catch (error) { if (error.code === "ENOENT") return; throw error; }
  if (stat.isSymbolicLink()) fail(`output contains a symlink: ${path}`);
  if (stat.isFile() && stat.nlink > 1) fail(`output contains a hard link: ${path}`);
  if (!stat.isFile() && !stat.isDirectory()) fail(`output contains a non-regular file: ${path}`);
  if (stat.isDirectory()) for (const name of readdirSync(path)) refuseSymlinks(join(path, name));
}
refuseSymlinks(args.out);
let previous = [];
if (existsSync(LOCK)) {
  let lock;
  try { lock = JSON.parse(readFileSync(LOCK, "utf8")); } catch { fail("existing lock is not valid JSON"); }
  if (lock.repo !== "bradcerb/bstack" || !Array.isArray(lock.skills) || !lock.skills.every((name) => typeof name === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))) fail("existing lock contains invalid skill names");
  previous = lock.skills;
}
for (const s of picked) if (existsSync(join(args.out, s.skill)) && !previous.includes(s.skill)) fail(`refusing to overwrite an unmanaged skill: ${s.skill}`);
for (const s of previous) rmSync(join(args.out, s), { recursive: true, force: true });
for (const s of picked) {
  const base = `plugins/${s.plugin}/skills/${s.skill}`;
  for (const f of filesOf(s)) {
    const to = join(args.out, s.skill, relative(base, f));
    mkdirSync(dirname(to), { recursive: true });
    writeFileSync(to, execFileSync("git", ["show", `HEAD:${f}`], { cwd: root }), { mode: lstatSync(join(root, f)).mode & 0o777 });
  }
}
writeFileSync(join(args.out, "SOURCES.md"), execFileSync("git", ["show", "HEAD:SOURCES.md"], { cwd: root }));

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
