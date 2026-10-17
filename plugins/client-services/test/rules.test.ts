// Unit tests: thresholds, health checks, and the month-over-month diff rules.
import test from "node:test";
import assert from "node:assert/strict";
import { buildModel, deltaLabel, health } from "../skills/hosting-snapshot-diff/rules";
import { parseModel } from "../lib/model";
import { fill, pct } from "../lib/format";
import { parseMonth } from "../lib/ids";
import { addMonths, daysBetween } from "../lib/months";
import type { Snapshot } from "../lib/snapshot";
import { sender, copy, site, snap, thresholds } from "./helpers";

const T = thresholds();
const model = (snaps: Snapshot[], s = site) => parseModel(buildModel({ site: s, snapshots: snaps, thresholds: T, copy: copy(), sender }));

test("uptime threshold: at the target is ok, just below is not", () => {
  assert.equal(health(snap("2026-11", { uptime: { pct: 99.9, incidents: 1, downMinutes: 40, incidentDays: [3] } }), site, T).upOk, true);
  assert.equal(health(snap("2026-11", { uptime: { pct: 99.89, incidents: 1, downMinutes: 47, incidentDays: [3] } }), site, T).upOk, false);
});

test("speed: slow TTFB or low score makes it slow; both missing gives null", () => {
  assert.equal(health(snap("2026-11"), site, T).fast, true);
  assert.equal(health(snap("2026-11", { ttfb: { medianSec: 0.81, runsSec: [0.81] } }), site, T).fast, false);
  assert.equal(health(snap("2026-11", { pagespeed: { score: 89, runs: [89], lcpSec: null, cls: null, tbtMs: null } }), site, T).fast, false);
  assert.equal(health(snap("2026-11", { ttfb: null, pagespeed: null }), site, T).fast, null);
});

test("SSL: warn at sslWarnDays or fewer", () => {
  assert.equal(health(snap("2026-11", { ssl: { expires: "2026-12-31", daysLeft: T.sslWarnDays + 1, issuer: "x", issuedOn: null } }), site, T).sslOk, true);
  assert.equal(health(snap("2026-11", { ssl: { expires: "2026-12-30", daysLeft: T.sslWarnDays, issuer: "x", issuedOn: null } }), site, T).sslOk, false);
});

test("backups: one missed night is a watch item; failed restore test too", () => {
  assert.equal(health(snap("2026-11", { backups: { ok: 29, total: 30, daysMissed: [4], restoreTest: null } }), site, T).backupsOk, false);
  assert.equal(health(snap("2026-11", { backups: { ok: 30, total: 30, daysMissed: [], restoreTest: { date: "2026-11-02", passed: false } } }), site, T).backupsOk, false);
});

test("headline: healthy, one issue, several issues", () => {
  assert.equal(model([snap("2026-11")]).headline, copy().headline.healthy);
  assert.equal(model([snap("2026-11", { backups: { ok: 29, total: 30, daysMissed: [4], restoreTest: null } })]).headline, copy().headline.fixingOne);
  const two = snap("2026-11", { backups: { ok: 29, total: 30, daysMissed: [4], restoreTest: null }, uptime: { pct: 99.5, incidents: 2, downMinutes: 200, incidentDays: [1, 2] } });
  assert.equal(model([two]).headline, copy().headline.fixingSeveral);
});

test("attention: failed payment and a domain held elsewhere, max 2, in order", () => {
  const s = snap("2026-11", { billing: { state: "failed", invoiceDate: null, amount: 35, currency: "usd", subscriptionStatus: "past_due" }, domainRegistration: { expires: "2026-12-20", daysLeft: 19, registrar: "R" } });
  const m = model([s], { ...site, domainManagedBy: "Other Co" });
  assert.deepEqual(m.attention.map((a) => a.key), ["paymentFailed", "domainManagedElsewhere"]);
  assert.match(m.subject, /two quick things$/);
  assert.ok(!m.checklist.some((c) => c.key === "billing" || c.key === "domain"));
});

test("attention: domain expiring but managed by the sender is a reviewer note, not a client ask", () => {
  const m = model([snap("2026-11", { domainRegistration: { expires: "2026-12-20", daysLeft: 19, registrar: "R" } })]);
  assert.equal(m.attention.length, 0);
  assert.equal(m.attentionNone, copy().attention.none);
  assert.ok(m.review.notes.some((n) => n.includes("19 days")));
});

test("processing payment is not a failure", () => {
  const m = model([snap("2026-11", { billing: { state: "processing", invoiceDate: "2026-11-13", amount: 35, currency: "usd", subscriptionStatus: "active" } })]);
  assert.equal(m.attention.length, 0);
  assert.equal(m.checklist.find((c) => c.key === "billing")!.line, "November's $35 payment is on its way. Nothing to do.");
});

test("charts need at least minMonthsForChart months; first month has none", () => {
  const m = model([snap("2026-11")]);
  assert.equal(m.charts.length, 0);
  assert.equal(m.highlights.length, 0);
  assert.ok(m.review.notes.some((n) => n.includes("No snapshot for last month")));
  assert.equal(model([snap("2026-10"), snap("2026-11")]).charts.length, 2);
});

test("third chart: errors when they changed, else storage when disk is near the limit", () => {
  const prev = snap("2026-10", { errors: { errors5xx: 4, brokenPages: 0 } });
  const m = model([prev, snap("2026-11")]);
  assert.deepEqual(m.charts.map((c) => c.file), ["uptime.png", "speed.png", "errors.png"]);
  assert.equal(m.highlights[2].title, "No error pages");
  const disk = (p: number) => ({ ...snap("2026-11").server, diskPct: p });
  const m2 = model([snap("2026-10"), snap("2026-11", { server: disk(85) })]);
  assert.equal(m2.charts[2].file, "storage.png");
  assert.equal(m2.checklist.find((c) => c.key === "server")!.mark, "watch");
  assert.equal(model([snap("2026-10"), snap("2026-11", { server: disk(69) })]).charts.length, 2);
});

test("delta labels compare to last month", () => {
  const c = copy();
  assert.equal(deltaLabel(94, 92, parseMonth("2026-09"), String, c), "Up from 92");
  assert.equal(deltaLabel(90, 92, parseMonth("2026-09"), String, c), "Down from 92");
  assert.equal(deltaLabel(92, 92, parseMonth("2026-09"), String, c), "Same as Sep");
  assert.equal(deltaLabel(92, null, null, String, c), null);
});

test("missing sources never produce numbers or claims", () => {
  const s = snap("2026-11", { uptime: null, pagespeed: null, ttfb: null, backups: null, billing: null, ssl: null, domainRegistration: null, server: null, errors: null,
    sources: { uptimerobot: { status: "unavailable", reason: "no key" }, pagespeed: { status: "error", reason: "HTTP 500" }, ttfb: { status: "ok" }, ssl: { status: "ok" }, rdap: { status: "ok" }, forge: { status: "ok" }, stripe: { status: "ok" } } });
  const m = model([snap("2026-10"), s]);
  assert.equal(m.headlineSentence, "");
  assert.equal(m.careLog, "");
  assert.equal(m.charts.length, 0);
  assert.equal(m.checklist.length, 0);
  assert.equal(m.review.unavailableSources.length, 2);
  assert.doesNotMatch(JSON.stringify(m), /\d+(\.\d+)?%/);
});

test("history keeps only historyMonths and skips months with no data for a chart", () => {
  const snaps = Array.from({ length: 9 }, (_, i) => snap(addMonths("2026-03", i)));
  snaps[7].pagespeed = null;
  const m = model(snaps);
  assert.equal(m.charts[0].labels.length, T.historyMonths);
  assert.equal(m.charts[1].labels.length, T.historyMonths - 1);
});

test("copy rules: no em-dashes anywhere, and templates fail loudly on a missing value", () => {
  assert.doesNotMatch(JSON.stringify(copy()), /\u2014/);
  assert.throws(() => fill("Hi {name}", {}), /missing value/);
});

test("format and month helpers", () => {
  assert.equal(pct(99.98), "99.98%");
  assert.equal(pct(99.9), "99.9%");
  assert.equal(pct(100), "100%");
  assert.equal(addMonths("2026-12", 1), "2027-01");
  assert.equal(addMonths("2027-01", -1), "2026-12");
  assert.equal(daysBetween("2026-10-17", "2026-11-12"), 26);
});
