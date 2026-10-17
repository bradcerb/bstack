// collect (mocked) and diff as separate CLIs, run twice: byte-identical outputs, and the example model is golden.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sha256 } from "../lib/io";
import { EXAMPLES, KIT, readJ } from "./helpers";

const run = (script: string, args: string[], env: Record<string, string> = {}) =>
  execFileSync(process.execPath, [require.resolve("tsx/cli"), join(KIT, "skills", script), ...args], { encoding: "utf8", env: { PATH: process.env.PATH as string, HOME: process.env.HOME as string, ...env } });

function workspace() {
  const dir = mkdtempSync(join(tmpdir(), "cs-chain-"));
  cpSync(EXAMPLES, dir, { recursive: true });
  return { dir, config: join(dir, "workspace.example.json") };
}
const golden = () => readJ(join(EXAMPLES, "golden.json")).files as Record<string, string>;

test("example month: diff output is byte-identical across runs and matches golden.json", () => {
  const outs = [workspace(), workspace()].map((w) => {
    run("hosting-snapshot-diff/diff.ts", ["--config", w.config, "--site", "example", "--month", "2026-10", "--out", join(w.dir, "out")]);
    return { model: sha256(readFileSync(join(w.dir, "out/model.json"))), note: sha256(readFileSync(join(w.dir, "out/review-note.md"))) };
  });
  assert.deepEqual(outs[0], outs[1]);
  assert.deepEqual({ "model.json": outs[0].model, "review-note.md": outs[0].note }, golden());
  assert.equal(outs[0].model, sha256(readFileSync(join(EXAMPLES, "model.example.json"))));
});

test("mocked collect then diff: same snapshot bytes twice, and no key value anywhere in the outputs", () => {
  const env = { UPTIMEROBOT_API_KEY: "k1-secret", PAGESPEED_API_KEY: "k2-secret", FORGE_API_TOKEN: "k3-secret", STRIPE_RESTRICTED_KEY: "k4-secret" };
  const hashes = [workspace(), workspace()].map((w) => {
    const args = ["--config", w.config, "--site", "example", "--month", "2026-11", "--as-of", "2026-12-01", "--mocks", join(w.dir, "mocks/routes.json"), "--exec-mocks", join(w.dir, "mocks/exec.json")];
    const log = run("hosting-metrics-collect/collect.ts", args, env);
    assert.throws(() => run("hosting-metrics-collect/collect.ts", args, env), /frozen/);
    run("hosting-snapshot-diff/diff.ts", ["--config", w.config, "--site", "example", "--month", "2026-11", "--out", join(w.dir, "out")]);
    const snap = readFileSync(join(w.dir, "snapshots/snapshot-example-2026-11.json"), "utf8");
    const model = readFileSync(join(w.dir, "out/model.json"), "utf8");
    for (const v of Object.values(env)) assert.ok(!(snap + model + log).includes(v), "a key value leaked");
    return [sha256(snap), sha256(model)];
  });
  assert.deepEqual(hashes[0], hashes[1]);
});
