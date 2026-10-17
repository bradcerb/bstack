// Collector tests with recorded API responses: fail-soft behavior, parsing, and secret safety.
import test from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { collectSnapshot, keysFrom, mockExec } from "../skills/hosting-metrics-collect/collect";
import { parseCert } from "../skills/hosting-metrics-collect/sources/ssl";
import { invoiceState } from "../skills/hosting-metrics-collect/sources/stripe";
import { mockHttp, type RecordedCall } from "../lib/http";
import { findSite, loadSites } from "../lib/config";
import { parseIsoDate, parseMonth, parseSiteId } from "../lib/ids";
import { loadWorkspace } from "../lib/workspace";
import { KIT, WORKSPACE } from "./helpers";

const ws = loadWorkspace(WORKSPACE);
const site = findSite(loadSites(join(KIT, "examples/sites.json")), parseSiteId("example"));
const month = parseMonth("2026-11"), asOf = parseIsoDate("2026-12-01");
const routes = join(KIT, "examples/mocks/routes.json");
const exec = mockExec(join(KIT, "examples/mocks/exec.json"));
const env = { UPTIMEROBOT_API_KEY: "ur-secret-123", PAGESPEED_API_KEY: "ps-secret-123", FORGE_API_TOKEN: "fg-secret-123", STRIPE_RESTRICTED_KEY: "rk-secret-123" };

test("all sources ok with recorded responses", async () => {
  const calls: RecordedCall[] = [];
  const s = await collectSnapshot({ site, month, asOf, http: mockHttp(routes, calls), exec, keys: keysFrom(ws, env), collectedAt: null });
  for (const [k, v] of Object.entries(s.sources)) assert.equal(v?.status, "ok", k);
  assert.deepEqual(s.uptime, { pct: 99.972, incidents: 1, downMinutes: 12, incidentDays: [20] });
  assert.deepEqual(s.ttfb, { medianSec: 0.412, runsSec: [0.412, 0.412, 0.412] });
  assert.equal(s.pagespeed?.score, 93);
  assert.deepEqual(s.ssl, { expires: "2027-02-09", daysLeft: 70, issuer: "Let's Encrypt", issuedOn: "2026-11-11" });
  assert.equal(s.domainRegistration?.daysLeft, 278);
  assert.equal(s.server?.php, "8.4");
  assert.equal(s.server?.diskPct, null);
  assert.deepEqual([s.backups?.ok, s.backups?.total, s.backups?.daysMissed], [29, 30, [18]]);
  assert.deepEqual(s.billing, { state: "paid", invoiceDate: "2026-11-17", amount: 35, currency: "usd", subscriptionStatus: "active" });
  // No secret ever lands in the snapshot or the recorded request log.
  const all = JSON.stringify(s) + JSON.stringify(calls);
  for (const v of Object.values(env)) assert.ok(!all.includes(v), "secret leaked");
});

test("no keys: keyed sources are 'unavailable' and their sections are null", async () => {
  const s = await collectSnapshot({ site, month, asOf, http: mockHttp(routes), exec, keys: keysFrom(ws, {}), collectedAt: null });
  for (const k of ["uptimerobot", "pagespeed", "forge", "forgeBackups", "stripe"]) assert.equal((s.sources as any)[k].status, "unavailable", k);
  assert.equal(s.uptime, null); assert.equal(s.pagespeed, null); assert.equal(s.server, null); assert.equal(s.billing, null); assert.equal(s.backups, null);
  assert.equal(s.sources.ttfb?.status, "ok"); assert.equal(s.sources.rdap?.status, "ok");
  assert.match(s.sources.uptimerobot?.reason ?? "", /UPTIMEROBOT_API_KEY not set/);
});

test("API failures become 'error' without numbers and without leaking keys", async () => {
  const s = await collectSnapshot({ site, month, asOf, http: mockHttp(null), exec: async () => { throw new Error("network down ur-secret-123"); }, keys: keysFrom(ws, env), collectedAt: null });
  for (const k of ["uptimerobot", "pagespeed", "ttfb", "ssl", "rdap", "forge", "stripe"]) assert.equal((s.sources as any)[k].status, "error", k);
  assert.ok(!JSON.stringify(s).includes("ur-secret-123"));
  assert.equal(s.ttfb, null);
});

test("placeholder config counts as not configured", async () => {
  const s = await collectSnapshot({ site: { ...site, stripe: { subscriptionId: "PLACEHOLDER_X" } }, month, asOf, http: mockHttp(routes), exec, keys: keysFrom(ws, env), collectedAt: null });
  assert.equal(s.sources.stripe?.status, "unavailable");
});

test("openssl parsing", () => {
  const c = parseCert("notBefore=Aug 14 01:42:05 2026 GMT\nnotAfter=Nov 12 01:42:04 2026 GMT\nissuer=C=US, O=Let's Encrypt, CN=YE2\n");
  assert.deepEqual(c, { expires: "2026-11-12", issuedOn: "2026-08-14", issuer: "Let's Encrypt" });
});

test("Stripe invoice states", () => {
  assert.equal(invoiceState({ status: "paid" }, { status: "active" }, 0), "paid");
  assert.equal(invoiceState({ status: "open" }, { status: "active" }, 0), "processing");
  assert.equal(invoiceState({ status: "open" }, { status: "past_due" }, 0), "failed");
  assert.equal(invoiceState({ status: "open", due_date: 100 }, { status: "active" }, 200), "failed");
  assert.equal(invoiceState({ status: "uncollectible" }, {}, 0), "failed");
  assert.equal(invoiceState(null, {}, 0), "none");
});

test("no secrets entry in workspace.json: the reason names the missing entry, not a value", async () => {
  const bare = { ...ws, doc: { ...ws.doc, secrets: {} } };
  const k = keysFrom(bare, env);
  assert.deepEqual(k.keys, {});
  assert.equal(k.keyMissing("forge"), "no secrets.forge entry in workspace.json");
});
