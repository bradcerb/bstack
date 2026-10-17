#!/usr/bin/env node
// Repo checks that would otherwise live in review comments. No dependencies: `node scripts/repo-lint.mjs`.
//  1. No personal, client or brand strings in any SKILL.md or in plugin code, examples, copy, or schemas.
//  2. No em-dashes in any SKILL.md, in report copy, or in plugin code and examples.
//  3. The pure layers (diff, model, snapshot, format) import nothing that can reach the network or a process.
//  4. Secrets: env values are read only through lib/workspace.ts (secretValue), never by name elsewhere.
//  5. ApprovedDraft is never cast or issued outside approval-stage.
//  6. Shared lib files copied between plugins stay byte-identical.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const walk = (d) => (existsSync(d) ? readdirSync(d).flatMap((f) => {
  if (f === "node_modules" || f === ".out" || f === "package-lock.json") return [];
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
}) : []);
const rel = (p) => relative(root, p);
const problems = [];
const KIT = ["plugins/client-services", "plugins/agent-ops"].map((p) => join(root, p));
const MANIFEST = /(^|\/)(plugin|marketplace)\.json$|\.claude-plugin|\.cursor-plugin|(^|\/)package\.json$/;

// Denylist of personal, client, and brand terms, stored as sha256 prefixes so the names never appear in code.
// Add a term: node -e 'console.log(require("crypto").createHash("sha256").update("term").digest("hex").slice(0,16))'
// Matched against each lowercase word, each two-word phrase, and each word's first six letters.
const DENY_HASHES = new Set(["322f965a2919f467", "2cb1b1987de67323", "d4b61badb0938463", "29452a304056664a", "b51976231e408137", "1a084da1c2190657", "e836933950d33a65", "8a57a440886c5942"]);
const h16 = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
function denied(line) {
  const words = line.toLowerCase().match(/[a-z0-9:]+/g) ?? [];
  for (let i = 0; i < words.length; i++) {
    for (const t of [words[i], words[i].slice(0, 6), i + 1 < words.length ? `${words[i]} ${words[i + 1]}` : ""]) {
      if (t && DENY_HASHES.has(h16(t))) return words[i];
    }
  }
  return null;
}
const skillFiles = walk(join(root, "plugins")).filter((p) => p.endsWith("/SKILL.md"));
const kitFiles = KIT.flatMap(walk).filter((p) => /\.(ts|mjs|json|md)$/.test(p) && !MANIFEST.test(rel(p)));
for (const f of new Set([...skillFiles, ...kitFiles])) {
  readFileSync(f, "utf8").split("\n").forEach((line, i) => {
    const m = denied(line);
    if (m) problems.push(`${rel(f)}:${i + 1}: personal or brand string "${m}" (belongs in your workspace files)`);
    if (line.includes("\u2014")) problems.push(`${rel(f)}:${i + 1}: em-dash`);
  });
}

const PURE = [
  "plugins/client-services/skills/hosting-snapshot-diff",
  "plugins/client-services/lib/format.ts",
  "plugins/client-services/lib/months.ts",
  "plugins/client-services/lib/model.ts",
  "plugins/client-services/lib/snapshot.ts",
  "plugins/client-services/lib/ids.ts",
  "plugins/client-services/lib/result.ts",
];
const IMPURE = [
  [/from\s+["'](node:)?(http|https|net|tls|dgram|child_process)["']/, "network or process import"],
  [/from\s+["'][./]*lib\/http["']/, "http client import"],
  [/\bfetch\s*\(/, "fetch call"],
];
for (const p of PURE) {
  const abs = join(root, p);
  for (const f of statSync(abs).isDirectory() ? walk(abs) : [abs]) {
    if (!f.endsWith(".ts")) continue;
    const src = readFileSync(f, "utf8");
    for (const [re, why] of IMPURE) if (re.test(src)) problems.push(`${rel(f)}: ${why} in a pure layer`);
  }
}

for (const f of kitFiles.filter((p) => p.endsWith(".ts"))) {
  const src = readFileSync(f, "utf8");
  const r = rel(f);
  if (!r.endsWith("lib/workspace.ts") && !r.includes("/test/") && /process\.env(\.|\[)/.test(src)) problems.push(`${r}: reads an env var directly; name it under secrets in workspace.json and use secretValue`);
  if (/console\.\w+\([^)]*process\.env/.test(src)) problems.push(`${r}: prints process.env`);
  if (/as\s+(unknown\s+as\s+)?ApprovedDraft\b/.test(src) && !r.includes("/test/")) problems.push(`${r}: casts to ApprovedDraft`);
  if (/ApprovedDraft\.issue\(/.test(src) && !r.endsWith("skills/approval-stage/approval.ts")) problems.push(`${r}: issues an ApprovedDraft outside approval-stage`);
}

for (const f of ["schema.ts", "io.ts", "http.ts", "workspace.ts"]) {
  const [a, b] = KIT.map((p) => join(p, "lib", f));
  if (readFileSync(a, "utf8") !== readFileSync(b, "utf8")) problems.push(`lib/${f} differs between client-services and agent-ops; change both copies together`);
}

for (const p of problems) console.error(`repo-lint: ${p}`);
if (problems.length) process.exit(1);
console.log(`repo-lint: ok (${skillFiles.length} SKILL.md, ${kitFiles.length} kit files)`);
