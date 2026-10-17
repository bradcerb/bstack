// hosting-metrics-collect: measure one site for one month and write snapshot-<siteId>-<YYYY-MM>.json.
// Network boundary of the kit. Every source fails soft: missing config or key -> unavailable, API error -> error.
// No number is ever guessed, and no key value can reach the snapshot or the console.
// Usage: tsx collect.ts --site <id> --month <YYYY-MM> [--config <workspace.json>] [--as-of YYYY-MM-DD] [--force]
//        [--mocks <routes.json>] [--exec-mocks <exec.json>]
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findSite, hostingSettings, loadSites, sitesFile, type Site } from "../../lib/config";
import { mockHttp, realHttp, type Http } from "../../lib/http";
import { parseIsoDate, parseMonth, parseSiteId, type IsoDate, type Month } from "../../lib/ids";
import { parseArgs, runCli, writeJson } from "../../lib/io";
import { dataOf, failed, statusOf, type SourceResult } from "../../lib/result";
import { parseSnapshot, type Backups, type Server, type Snapshot } from "../../lib/snapshot";
import { loadWorkspace, resolvePath, secretValue, type Workspace } from "../../lib/workspace";
import { collectForge } from "./sources/forge";
import { collectPageSpeed } from "./sources/pagespeed";
import { collectRdap } from "./sources/rdap";
import { collectSsl } from "./sources/ssl";
import { collectStripe } from "./sources/stripe";
import { collectTtfb } from "./sources/ttfb";
import type { Ctx, Exec, KeyName } from "./sources/types";
import { collectUptime } from "./sources/uptimerobot";

export const realExec: Exec = (cmd, args) =>
  new Promise((resolve, reject) => execFile(cmd, args, { timeout: 45000, maxBuffer: 1 << 20 }, (err, stdout) => (err && !stdout ? reject(new Error(`${cmd} failed`)) : resolve(String(stdout)))));
// exec.json: [{ "cmd": "curl", "stdout": "200 0.41" }]. First match by command name wins; repeated calls reuse it.
export function mockExec(file: string): Exec {
  const rows: { cmd: string; contains?: string; stdout: string }[] = JSON.parse(readFileSync(file, "utf8"));
  return async (cmd, args) => {
    const r = rows.find((x) => x.cmd === cmd && (!x.contains || args.join(" ").includes(x.contains)));
    if (!r) throw new Error(`no recorded output for ${cmd}`);
    return r.stdout;
  };
}

const KEY_NAMES: KeyName[] = ["uptimerobot", "pagespeed", "forge", "stripe"];
export function keysFrom(ws: Workspace, env: NodeJS.ProcessEnv): Pick<Ctx, "keys" | "keyMissing"> {
  const keys: Ctx["keys"] = {};
  const why: Partial<Record<KeyName, string>> = {};
  for (const k of KEY_NAMES) {
    const s = secretValue(ws, k, env);
    if (s.value) keys[k] = s.value;
    else why[k] = s.env ? `${s.env} not set` : `no secrets.${k} entry in workspace.json`;
  }
  return { keys, keyMissing: (k) => why[k] ?? "key missing" };
}

// Error messages are trimmed and every key value is masked before they are stored.
export function safeReason(e: unknown, keys: Ctx["keys"]): string {
  let msg = String((e as Error)?.message ?? e).slice(0, 200);
  for (const v of Object.values(keys)) if (v && v.length > 3) msg = msg.split(v).join("[redacted]");
  return msg;
}
async function soft<T>(fn: () => Promise<SourceResult<T>>, keys: Ctx["keys"]): Promise<SourceResult<T>> {
  try {
    return await fn();
  } catch (e) {
    return failed(safeReason(e, keys));
  }
}

export async function collectSnapshot(o: { site: Site; month: Month; asOf: IsoDate; http: Http; exec: Exec; keys: Pick<Ctx, "keys" | "keyMissing">; collectedAt: string | null }): Promise<Snapshot> {
  const ctx: Ctx = { site: o.site, month: o.month, asOf: o.asOf, http: o.http, exec: o.exec, ...o.keys };
  const k = ctx.keys;
  // Point-in-time checks (SSL, domain, server) describe the moment of collection; run right after the month ends.
  const [uptime, pagespeed, ttfb, ssl, rdap, stripe] = await Promise.all([
    soft(() => collectUptime(ctx), k), soft(() => collectPageSpeed(ctx), k), soft(() => collectTtfb(ctx), k),
    soft(() => collectSsl(ctx), k), soft(() => collectRdap(ctx), k), soft(() => collectStripe(ctx), k),
  ]);
  let forge: SourceResult<Server>, backups: SourceResult<Backups>;
  try {
    ({ forge, backups } = await collectForge(ctx));
  } catch (e) {
    const reason = safeReason(e, k);
    forge = failed(reason);
    backups = failed(reason);
  }
  const snap = {
    schema: "hosting-snapshot", version: 1, siteId: o.site.id, domain: o.site.domain, month: o.month, collectedAt: o.collectedAt,
    sources: { uptimerobot: statusOf(uptime), pagespeed: statusOf(pagespeed), ttfb: statusOf(ttfb), ssl: statusOf(ssl), rdap: statusOf(rdap), forge: statusOf(forge), forgeBackups: statusOf(backups), stripe: statusOf(stripe) },
    uptime: dataOf(uptime), ttfb: dataOf(ttfb), pagespeed: dataOf(pagespeed), ssl: dataOf(ssl), domainRegistration: dataOf(rdap),
    server: dataOf(forge), backups: dataOf(backups), billing: dataOf(stripe), errors: null,
  };
  return parseSnapshot(snap, "collected snapshot"); // our own output is checked too, before anything is written
}

export const snapshotFile = (dir: string, siteId: string, month: string) => join(dir, `snapshot-${siteId}-${month}.json`);

if (require.main === module) runCli(async () => {
  const a = parseArgs();
  const ws = loadWorkspace(typeof a.config === "string" ? a.config : undefined);
  const h = hostingSettings(ws);
  const siteId = parseSiteId(a.site), month = parseMonth(a.month);
  const site = findSite(loadSites(sitesFile(ws)), siteId);
  const now = new Date();
  const asOf = parseIsoDate(typeof a["as-of"] === "string" ? a["as-of"] : now.toISOString().slice(0, 10));
  const file = snapshotFile(resolvePath(ws, h.snapshots_dir), siteId, month);
  if (existsSync(file) && a.force !== true) throw new Error(`${file} already exists. Snapshots are frozen once written; pass --force to replace it.`);
  const mocked = typeof a.mocks === "string";
  const snap = await collectSnapshot({
    site, month, asOf,
    http: mocked ? mockHttp(a.mocks as string) : realHttp,
    exec: typeof a["exec-mocks"] === "string" ? mockExec(a["exec-mocks"] as string) : realExec,
    keys: keysFrom(ws, process.env),
    collectedAt: mocked ? null : now.toISOString(),
  });
  writeJson(file, snap);
  console.log(`snapshot written: ${file}\n${Object.entries(snap.sources).map(([n, v]) => `${n}=${v?.status}`).join(" ")}`);
});
