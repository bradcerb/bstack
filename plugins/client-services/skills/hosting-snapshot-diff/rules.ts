// Pure rules: snapshots + thresholds + copy templates in, report model out.
// No LLM, no clock, no Intl, no network. Same input bytes always give the same model.
// A section whose data is missing (source unavailable) is left out. Nothing is ever guessed.
import type { Copy, Thresholds } from "../../lib/config";
import { capitalize, count, dateLong, dateShort, fill, joinList, money, monthLong, monthShort, monthYear, pct, pctInt, sec } from "../../lib/format";
import type { Month, SiteId } from "../../lib/ids";
import { MODEL_SCHEMA, MODEL_VERSION, type ChartSpec, type HostingReportModel } from "../../lib/model";
import { addMonths } from "../../lib/months";
import type { Snapshot } from "../../lib/snapshot";

export interface SiteInfo { id: SiteId; domain: string; greetingNames: string; domainManagedBy?: string | null }
export interface Sender { name: string; projectUrl: string }
export type Mark = "ok" | "watch";

const inMonth = (iso: string | null | undefined, ym: string): iso is string => !!iso && iso.slice(0, 7) === ym;

// ---- Health checks: each returns true/false, or null when the data is missing ----
export function health(cur: Snapshot, site: SiteInfo, t: Thresholds) {
  const upOk = cur.uptime ? cur.uptime.pct >= t.uptimeTargetPct : null;
  const ttfbOk = cur.ttfb ? cur.ttfb.medianSec <= t.ttfbGoodSec : null;
  const perfOk = cur.pagespeed ? cur.pagespeed.score >= t.perfGoodScore : null;
  const fast = ttfbOk === null && perfOk === null ? null : ttfbOk !== false && perfOk !== false;
  const missed = cur.backups ? cur.backups.total - cur.backups.ok : null;
  const backupsOk = cur.backups ? (missed as number) < t.backupMissWarn && (!cur.backups.restoreTest || cur.backups.restoreTest.passed) : null;
  const sslOk = cur.ssl ? cur.ssl.daysLeft > t.sslWarnDays : null;
  const domainSoon = cur.domainRegistration ? cur.domainRegistration.daysLeft <= t.domainWarnDays : false;
  const domainElsewhere = !!site.domainManagedBy;
  const disk = cur.server?.diskPct ?? null;
  const diskOk = disk === null ? null : disk < t.diskWarnPct;
  const paymentFailed = cur.billing?.state === "failed";
  const siteIssues = [upOk, backupsOk, sslOk].filter((x) => x === false).length;
  return { upOk, fast, missed, backupsOk, sslOk, domainSoon, domainElsewhere, disk, diskOk, paymentFailed, siteIssues };
}

// Delta label shown on a chart: compares this month to last month.
export function deltaLabel(cur: number, prev: number | null, prevMonth: Month | null, f: (v: number) => string, copy: Copy) {
  if (prev === null || prevMonth === null) return null;
  return cur > prev ? fill(copy.highlights.deltaUp, { prev: f(prev) }) : cur < prev ? fill(copy.highlights.deltaDown, { prev: f(prev) }) : fill(copy.highlights.deltaSame, { prevMonth: monthShort(prevMonth) });
}

export function loadPhrase(s: number, c: Copy["highlights"]["speed"]) {
  return s < 0.5 ? c.loadUnderHalf : s < 1 ? c.loadUnderOne : fill(c.loadAbout, { seconds: Math.round(s) });
}

const FMT = { pct, pctInt, int: (v: number) => String(v), sec };

export function buildModel(input: { site: SiteInfo; snapshots: Snapshot[]; thresholds: Thresholds; copy: Copy; sender: Sender; inputs?: { month: string; sha256: string }[] }): HostingReportModel {
  const { site, thresholds: t, copy: c, sender } = input;
  const snaps = [...input.snapshots].sort((a, b) => (a.month < b.month ? -1 : 1));
  if (!snaps.length) throw new Error("no snapshots");
  const cur = snaps[snaps.length - 1];
  const prevMonthKey = addMonths(cur.month, -1);
  const prev = snaps.find((s) => s.month === prevMonthKey) ?? null;
  const firstKept = addMonths(cur.month, -(t.historyMonths - 1));
  const history = snaps.filter((s) => s.month >= firstKept);
  const M = monthLong(cur.month);
  const P = prev ? monthLong(prev.month) : null;
  const MY = monthYear(cur.month);
  const h = health(cur, site, t);

  // 1. Headline and one summary sentence
  const headline = h.siteIssues === 0 ? c.headline.healthy : h.siteIssues === 1 ? c.headline.fixingOne : c.headline.fixingSeveral;
  const parts: string[] = [];
  if (cur.uptime) parts.push(fill(h.upOk ? c.sentence.upOk : c.sentence.upLow, { uptime: pct(cur.uptime.pct), month: M }));
  if (h.fast !== null) parts.push(h.fast ? c.sentence.fast : c.sentence.slow);
  if (cur.backups) parts.push(h.missed === 0 ? c.sentence.backupsAll : fill(c.sentence.backupsSome, { ok: cur.backups.ok, total: cur.backups.total }));
  const headlineSentence = parts.length ? `${capitalize(joinList(parts))}.` : "";

  // 2. What was done this month (only what the data proves)
  const did: string[] = [];
  if (cur.uptime) did.push(c.care.monitoring);
  const upd = cur.server?.securityUpdates ?? null;
  if (upd !== null && upd > 0) did.push(fill(upd === 1 ? c.care.securityUpdatesOne : c.care.securityUpdatesMany, { count: count(upd) }));
  if (cur.ssl && inMonth(cur.ssl.issuedOn, cur.month)) did.push(c.care.sslRenewed);
  if (cur.backups) did.push(h.missed === 0 ? c.care.backupsAll : c.care.backupsSome);
  const careLog = did.length ? fill(c.care.intro, { items: joinList(did) }) + (cur.backups?.restoreTest?.passed ? c.care.endRestoreTested : c.care.end) : "";

  // 3. Needs your attention: things only the client can do, in priority order
  const attention: { key: string; title: string; body: string }[] = [];
  if (h.paymentFailed) attention.push({ key: "paymentFailed", title: fill(c.attention.paymentFailed.title, { month: M }), body: c.attention.paymentFailed.body });
  if (h.domainSoon && h.domainElsewhere && cur.domainRegistration)
    attention.push({ key: "domainManagedElsewhere", title: fill(c.attention.domainManagedElsewhere.title, { date: dateShort(cur.domainRegistration.expires) }), body: fill(c.attention.domainManagedElsewhere.body, { holder: site.domainManagedBy as string }) });
  const att = attention.slice(0, t.maxAttention);

  // 4. Highlights with charts (only when enough months of data exist)
  const highlights: { key: string; title: string; chart: string; caption: string; alt: string }[] = [];
  const charts: ChartSpec[] = [];
  const series = (get: (s: Snapshot) => number | null | undefined) => history.filter((s) => get(s) !== null && get(s) !== undefined).map((s) => ({ month: s.month, v: get(s) as number }));
  const altPrev = (f: (v: number) => string, pv: number | null) => (prev && pv !== null ? fill(c.highlights.altPrevPart, { prevMonth: P as string, prevValue: f(pv) }) : "");
  const addChart = (key: string, title: string, caption: string, alt: string, s: { month: string; v: number }[], spec: Omit<ChartSpec, "file" | "type" | "labels" | "values" | "delta">, prevVal: number | null) => {
    if (s.length < t.minMonthsForChart) return;
    const f = FMT[spec.valueFormat];
    const file = `${key}.png`;
    charts.push({ file, type: "bars", labels: s.map((x) => monthShort(x.month)), values: s.map((x) => x.v), ...spec, delta: deltaLabel(s[s.length - 1].v, prevVal, prev ? prev.month : null, f, c) });
    highlights.push({ key, title, chart: file, caption, alt });
  };

  if (cur.uptime) {
    const u = cur.uptime, cu = c.highlights.uptime;
    const caption = !h.upOk ? fill(cu.captionLow, { minutes: u.downMinutes }) : u.incidents === 0 ? cu.captionNone :
      u.incidents === 1 ? (u.incidentDays.length ? fill(cu.captionOne, { minutes: u.downMinutes, monthShort: monthShort(cur.month), day: u.incidentDays[0] }) : fill(cu.captionOneNoDay, { minutes: u.downMinutes })) :
      fill(cu.captionMany, { count: count(u.incidents), minutes: u.downMinutes });
    const s = series((x) => x.uptime?.pct);
    const pv = prev?.uptime?.pct ?? null;
    addChart("uptime", cu.title, caption, fill(cu.alt, { firstMonth: monthLong(s[0].month), month: M, value: pct(u.pct), prevPart: altPrev(pct, pv) }), s,
      { valueFormat: "pct", min: t.uptimeChartMinPct, max: 100, target: { value: t.uptimeTargetPct, label: fill(cu.goal, { target: pct(t.uptimeTargetPct) }) }, scaleNote: fill(cu.scaleNote, { min: pct(t.uptimeChartMinPct) }) }, pv);
  }
  if (cur.pagespeed) {
    const cs = c.highlights.speed, score = cur.pagespeed.score;
    const pv = prev?.pagespeed?.score ?? null;
    const changePart = pv === null ? cs.changeNone : score > pv ? fill(cs.changeUp, { prev: pv }) : score < pv ? fill(cs.changeDown, { prev: pv }) : fill(cs.changeSame, { prevMonth: P as string });
    const caption = (cur.ttfb ? fill(cs.captionLoad, { loadPhrase: loadPhrase(cur.ttfb.medianSec, cs) }) : "") + fill(cs.captionScore, { score, changePart });
    addChart("speed", cs.title, caption, fill(cs.alt, { month: M, value: score, prevPart: altPrev(String, pv) }), series((x) => x.pagespeed?.score),
      { valueFormat: "int", min: 0, max: 100, target: { value: t.perfGoodScore, label: fill(cs.goal, { target: t.perfGoodScore }) }, scaleNote: null }, pv);
  }
  // One "what changed" chart, first match wins: error pages, then storage.
  const e = cur.errors, pe = prev?.errors;
  if (e && pe && e.errors5xx !== pe.errors5xx && (e.errors5xx > 0 || pe.errors5xx > 0)) {
    const ce = c.highlights.errors;
    const s = series((x) => x.errors?.errors5xx);
    addChart("errors", e.errors5xx === 0 ? ce.titleNone : ce.titleSome,
      e.errors5xx === 0 ? fill(ce.captionNone, { prevCount: count(pe.errors5xx), prevMonth: P as string }) : fill(e.errors5xx === 1 ? ce.captionSomeOne : ce.captionSomeMany, { count: e.errors5xx }),
      fill(ce.alt, { month: M, value: e.errors5xx, prevPart: altPrev(String, pe.errors5xx) }), s,
      { valueFormat: "int", min: 0, max: Math.max(5, ...s.map((x) => x.v)), target: null, scaleNote: null }, pe.errors5xx);
  } else if (h.disk !== null && h.disk >= t.diskNearPct) {
    const cd = c.highlights.storage;
    addChart("storage", cd.title, h.diskOk ? fill(cd.captionOk, { value: pctInt(h.disk) }) : cd.captionLow, fill(cd.alt, { month: M, value: pctInt(h.disk) }), series((x) => x.server?.diskPct),
      { valueFormat: "pctInt", min: 0, max: 100, target: { value: t.diskWarnPct, label: fill(cd.goal, { target: pctInt(t.diskWarnPct) }) }, scaleNote: null }, prev?.server?.diskPct ?? null);
  }
  const keepH = highlights.slice(0, t.maxCharts);
  const keepC = charts.filter((ch) => keepH.some((x) => x.chart === ch.file));

  // 5. Checklist: one line per item
  const cl = c.checklist;
  const checklist: { key: string; label: string; line: string; mark: Mark }[] = [];
  if (cur.ssl) {
    const s = cur.ssl;
    checklist.push({ key: "ssl", label: cl.ssl.label, mark: h.sslOk ? "ok" : "watch",
      line: !h.sslOk ? fill(cl.ssl.expiring, { date: dateShort(s.expires) }) : inMonth(s.issuedOn, cur.month) ? fill(cl.ssl.renewed, { renewed: dateShort(s.issuedOn), date: dateLong(s.expires) }) : fill(cl.ssl.ok, { date: dateLong(s.expires) }) });
  }
  if (cur.domainRegistration && !(h.domainSoon && h.domainElsewhere))
    checklist.push({ key: "domain", label: cl.domain.label, mark: "ok", line: fill(cl.domain.ok, { date: dateLong(cur.domainRegistration.expires) }) });
  if (cur.backups) {
    const b = cur.backups, missed = h.missed as number;
    checklist.push({ key: "backups", label: cl.backups.label, mark: h.backupsOk ? "ok" : "watch",
      line: missed === 0 ? fill(cl.backups.all, { ok: b.ok, total: b.total }) + (b.restoreTest?.passed ? fill(cl.backups.restorePassed, { date: dateShort(b.restoreTest.date) }) : "") :
        fill(cl.backups.some, { ok: b.ok, total: b.total, ones: missed === 1 ? cl.backups.missedOne : cl.backups.missedMany }) });
  }
  if (cur.server)
    checklist.push({ key: "server", label: cl.server.label, mark: h.diskOk === false ? "watch" : "ok",
      line: h.diskOk === false ? cl.server.lowDisk : upd === null ? cl.server.ok : upd > 0 ? cl.server.updated : cl.server.noUpdates });
  const bill = cur.billing;
  if (bill && (bill.state === "paid" || bill.state === "processing") && bill.amount !== null) {
    const amount = money(bill.amount, (c.currencySymbols as Record<string, string>)[(bill.currency ?? "usd").toLowerCase()] ?? "");
    if (bill.state === "paid" && bill.invoiceDate) checklist.push({ key: "billing", label: cl.billing.label, mark: "ok", line: fill(cl.billing.paid, { month: M, amount, date: dateShort(bill.invoiceDate) }) });
    if (bill.state === "processing") checklist.push({ key: "billing", label: cl.billing.label, mark: "ok", line: fill(cl.billing.processing, { month: M, amount }) });
  }
  const checklistTitle = checklist.every((x) => x.mark === "ok") ? cl.titleAllGood : cl.titleMixed;

  // 6. Reviewer-only details (never in the client email)
  const details: { label: string; value: string }[] = [];
  const u = cur.uptime, pu = prev?.uptime;
  if (u) details.push({ label: "Uptime", value: `${pct(u.pct)}${pu ? ` (${P} ${pct(pu.pct)})` : ""}, ${u.incidents} ${u.incidents === 1 ? "incident" : "incidents"}, ${u.downMinutes} min` });
  if (cur.ttfb) details.push({ label: `Server response (TTFB, median of ${cur.ttfb.runsSec.length})`, value: `${sec(cur.ttfb.medianSec)}${prev?.ttfb ? ` (${P} ${sec(prev.ttfb.medianSec)})` : ""}` });
  if (cur.pagespeed) { const p = cur.pagespeed; details.push({ label: `PageSpeed mobile (median of ${p.runs.length})`, value: `${p.score}${p.lcpSec !== null ? `, LCP ${p.lcpSec.toFixed(1)}s` : ""}${p.cls !== null ? `, CLS ${p.cls.toFixed(2)}` : ""}${p.tbtMs !== null ? `, TBT ${Math.round(p.tbtMs)}ms` : ""}` }); }
  if (cur.ssl) details.push({ label: "SSL certificate", value: `${cur.ssl.issuer}, expires ${dateLong(cur.ssl.expires)} (${cur.ssl.daysLeft} days)` });
  if (cur.domainRegistration) details.push({ label: "Domain", value: `expires ${dateLong(cur.domainRegistration.expires)} (${cur.domainRegistration.daysLeft} days)${cur.domainRegistration.registrar ? `, registrar ${cur.domainRegistration.registrar}` : ""}${site.domainManagedBy ? `, managed by ${site.domainManagedBy}` : ""}` });
  if (cur.server) { const s = cur.server; details.push({ label: "Server", value: [s.name && `name ${s.name}`, s.connected !== null && `connected ${s.connected ? "yes" : "no"}`, s.diskPct !== null && `disk ${s.diskPct}%`, s.php && `PHP ${s.php}`, s.ubuntu && `Ubuntu ${s.ubuntu}`, s.securityUpdates !== null && `${s.securityUpdates} security updates`, s.siteStatus && `site ${s.siteStatus}`, s.lastDeploy && `last deploy ${s.lastDeploy.date} ${s.lastDeploy.ok ? "ok" : "failed"}`].filter(Boolean).join(", ") }); }
  if (cur.errors) details.push({ label: "Server errors (5xx) / broken pages", value: `${cur.errors.errors5xx} / ${cur.errors.brokenPages}${pe ? ` (${P} ${pe.errors5xx} / ${pe.brokenPages})` : ""}` });
  if (cur.backups) details.push({ label: "Backups", value: `${cur.backups.ok}/${cur.backups.total}` + (cur.backups.restoreTest ? `, restore test ${cur.backups.restoreTest.passed ? "passed" : "failed"} ${dateShort(cur.backups.restoreTest.date)}` : "") });
  if (bill) details.push({ label: "Billing", value: `${bill.state}${bill.amount !== null ? `, ${bill.amount} ${bill.currency ?? ""}`.trimEnd() : ""}${bill.invoiceDate ? `, invoice ${bill.invoiceDate}` : ""}${bill.subscriptionStatus ? `, subscription ${bill.subscriptionStatus}` : ""}` });
  const unavailable = Object.entries(cur.sources).flatMap(([k, v]) => (v && v.status !== "ok" ? [{ source: k, status: v.status, reason: v.reason ?? "" }] : []));
  const notes: string[] = [];
  if (h.domainSoon && !h.domainElsewhere && cur.domainRegistration) notes.push(`Domain expires in ${cur.domainRegistration.daysLeft} days and you manage it. Renew it.`);
  if (cur.billing?.state === "processing") notes.push("Payment is still processing. Check it cleared.");
  if (!prev) notes.push("No snapshot for last month, so nothing is compared.");

  const status = att.length === 0 ? "none" : att.length === 1 ? "one" : "two";
  return {
    schema: MODEL_SCHEMA, version: MODEL_VERSION,
    siteId: site.id, domain: site.domain, month: cur.month, monthLabel: M, monthYear: MY, prevLabel: P,
    subject: fill(c.subject, { monthYear: MY, status: c.subjectStatus[status] }),
    preview: fill(c.preview[status], { headline }),
    headerMeta: fill(c.headerMeta, { monthYear: MY }),
    kicker: fill(c.kicker, { domain: site.domain, month: M }),
    headline, headlineSentence,
    greeting: fill(c.greeting, { names: site.greetingNames }), opener: c.opener, careLog,
    attentionHeading: c.attention.heading, attention: att, attentionNone: att.length ? null : c.attention.none,
    highlights: keepH, charts: keepC,
    checklistTitle, checklist,
    close: { question: c.close.question, projectLine: c.close.projectLine, projectLinkText: c.close.projectLinkText, projectUrl: sender.projectUrl, thanks: c.close.thanks, signature: sender.name },
    footer: { reason: fill(c.footer.reason, { domain: site.domain }), replyNote: c.footer.replyNote, preferencesText: c.footer.preferences },
    plainText: { titleLine: fill(c.plainText.titleLine, { domain: site.domain, monthYear: MY }), attentionHeading: c.plainText.attentionHeading },
    review: { details, unavailableSources: unavailable, notes },
    inputs: input.inputs ?? [],
  };
}
