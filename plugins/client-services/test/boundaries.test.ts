// Every handoff file is checked when read, and IDs only exist after parsing.
import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hostingSettings, loadCopy, loadSites } from "../lib/config";
import { parseIsoDate, parseMonth, parseSiteId } from "../lib/ids";
import { parseModel } from "../lib/model";
import { parseSnapshot } from "../lib/snapshot";
import { isUnset, loadWorkspace, setting } from "../lib/workspace";
import { loadSnapshots } from "../skills/hosting-snapshot-diff/diff";
import { checkRenderKit } from "../skills/monthly-hosting-report/run";
import { EXAMPLES, WORKSPACE, readJ, snap } from "./helpers";

const tmp = () => mkdtempSync(join(tmpdir(), "cs-test-"));
const ws = () => loadWorkspace(WORKSPACE);

test("ids: bad site ids, months and dates are refused", () => {
  assert.throws(() => parseSiteId("Bad Id"), /site id/);
  assert.throws(() => parseMonth("2026-13"), /month/);
  assert.throws(() => parseIsoDate("2026-02-30x"), /date/);
  assert.equal(parseMonth("2026-10"), "2026-10");
});

test("snapshot: missing field, extra field, wrong billing state all fail loudly", () => {
  const base = readJ(join(EXAMPLES, "snapshots/snapshot-example-2026-10.json"));
  assert.throws(() => parseSnapshot({ ...base, uptime: undefined }), /uptime: required|expected/);
  assert.throws(() => parseSnapshot({ ...base, guess: 1 }), /guess: not allowed/);
  assert.throws(() => parseSnapshot({ ...base, billing: { ...base.billing, state: "probably" } }), /billing.state/);
  assert.throws(() => parseSnapshot({ ...base, siteId: "Not Valid" }), /siteId|site id/);
});

test("diff: a snapshot whose content does not match its file name is refused", () => {
  const dir = tmp();
  writeFileSync(join(dir, "snapshot-s1-2026-11.json"), JSON.stringify(snap("2026-10")));
  assert.throws(() => loadSnapshots(dir, parseSiteId("s1"), parseMonth("2026-11"), 6), /do not match its name/);
});

test("model: dangling highlight chart and extra keys are refused", () => {
  const m = readJ(join(EXAMPLES, "model.example.json"));
  assert.doesNotThrow(() => parseModel(m));
  assert.throws(() => parseModel({ ...m, extra: true }), /extra: not allowed/);
  assert.throws(() => parseModel({ ...m, highlights: [{ ...m.highlights[0], chart: "x.png" }] }), /not in charts/);
});

test("workspace: REPLACE_WITH and via none count as unset; hosting block is schema-checked", () => {
  assert.equal(isUnset("REPLACE_WITH_X"), true);
  assert.equal(isUnset({ via: "none" }), true);
  assert.equal(isUnset({ via: "file", path: "REPLACE_WITH_PATH" }), true);
  assert.equal(isUnset({ via: "file", path: "a.json" }), false);
  const w = ws();
  assert.equal(hostingSettings(w).sender_name, "Alex");
  assert.throws(() => hostingSettings({ ...w, doc: { ...w.doc, hosting: { ...w.doc.hosting, senderName: "x" } } }), /senderName: not allowed/);
  assert.throws(() => hostingSettings({ ...w, doc: { ...w.doc, hosting: { ...w.doc.hosting, thresholds: { sslWarnDays: "14" } } } }), /sslWarnDays/);
  assert.throws(() => setting(w, "hosting.nope"), /not set/);
});

test("sites: unknown fields and duplicate ids are refused", () => {
  const dir = tmp();
  const doc = readJ(join(EXAMPLES, "sites.json"));
  writeFileSync(join(dir, "a.json"), JSON.stringify({ ...doc, sites: [{ ...doc.sites[0], contact: "x" }] }));
  assert.throws(() => loadSites(join(dir, "a.json")), /contact: not allowed/);
  writeFileSync(join(dir, "b.json"), JSON.stringify({ ...doc, sites: [doc.sites[0], doc.sites[0]] }));
  assert.throws(() => loadSites(join(dir, "b.json")), /unique/);
});

test("copy override: wording may change, keys may not, em-dashes are refused", () => {
  const dir = tmp();
  const w = { ...ws(), root: dir };
  const base = readJ(join(__dirname, "../copy/copy.en.json"));
  writeFileSync(join(dir, "ok.json"), JSON.stringify({ ...base, opener: "Hi." }));
  assert.equal(loadCopy(w, { ...hostingSettings(w), copy_file: "ok.json" }).opener, "Hi.");
  const { opener, ...missing } = base;
  writeFileSync(join(dir, "missing.json"), JSON.stringify(missing));
  assert.throws(() => loadCopy(w, { ...hostingSettings(w), copy_file: "missing.json" }), /opener: expected text/);
  writeFileSync(join(dir, "dash.json"), JSON.stringify({ ...base, opener: "Hi \u2014 there." }));
  assert.throws(() => loadCopy(w, { ...hostingSettings(w), copy_file: "dash.json" }), /em-dash/);
});

test("runner: refuses a missing render kit and a kit whose model schema differs", () => {
  const w = ws();
  const h = hostingSettings(w);
  assert.throws(() => checkRenderKit(w, h), /render kit not found/);
  const kit = tmp();
  cpSync(join(__dirname, "../schemas/hosting-report-model.v1.schema.json"), join(kit, "lib/hosting-report/hosting-report-model.v1.schema.json"), { recursive: true });
  writeFileSync(join(kit, "brand.json"), "{}");
  assert.doesNotThrow(() => checkRenderKit(w, { ...h, render_kit_dir: kit, render_brand_file: join(kit, "brand.json") }));
  const schema = join(kit, "lib/hosting-report/hosting-report-model.v1.schema.json");
  writeFileSync(schema, readFileSync(schema, "utf8").replace('"maxItems": 2', '"maxItems": 3'));
  assert.throws(() => checkRenderKit(w, { ...h, render_kit_dir: kit, render_brand_file: join(kit, "brand.json") }), /schema differs/);
});
