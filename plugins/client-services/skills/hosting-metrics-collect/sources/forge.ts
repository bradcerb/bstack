// Laravel Forge API (v2, org-scoped, read-only use): server, site, last deploy, database backups.
// IDs are looked up by name from sites.json, never hardcoded. Disk use and pending security updates
// are not in the Forge API, so they stay null.
import { isPlaceholder } from "../../../lib/config";
import { daysInMonth } from "../../../lib/months";
import type { Backups, IsoDate, Server } from "../../../lib/snapshot";
import { type Ctx, ok, type SourceResult, unavailable } from "./types";

const API = "https://forge.laravel.com/api";
const attr = (o: any, ...keys: string[]) => { for (const k of keys) { const v = o?.attributes?.[k] ?? o?.[k]; if (v !== undefined && v !== null) return v; } return null; };

async function list(ctx: Ctx, token: string, path: string, maxPages = 5) {
  const out: any[] = [];
  let url: string | null = `${API}${path}`;
  for (let i = 0; url && i < maxPages; i++) {
    const r = await ctx.http(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    if (r.status !== 200) throw new Error(`Forge HTTP ${r.status} on ${path}`);
    out.push(...(Array.isArray(r.json?.data) ? r.json.data : []));
    url = r.json?.links?.next ?? null;
  }
  return out;
}

export async function collectForge(ctx: Ctx): Promise<{ forge: SourceResult<Server>; backups: SourceResult<Backups> }> {
  const f = ctx.site.forge, token = ctx.keys.forge;
  if (!f || isPlaceholder(f.organization) || isPlaceholder(f.server)) { const s = unavailable("not configured for this site"); return { forge: s, backups: s }; }
  if (!token) { const s = unavailable(ctx.keyMissing("forge")); return { forge: s, backups: s }; }
  const org = encodeURIComponent(f.organization as string);
  const server = (await list(ctx, token, `/orgs/${org}/servers`)).find((s) => attr(s, "name") === f.server);
  if (!server) { const s = unavailable(`no Forge server named ${f.server}`); return { forge: s, backups: s }; }
  const sid = server.id;
  const site = f.site ? (await list(ctx, token, `/orgs/${org}/servers/${sid}/sites`)).find((s) => attr(s, "name") === f.site) : null;
  let lastDeploy: { date: IsoDate; ok: boolean } | null = null;
  if (site) {
    const deps = await list(ctx, token, `/orgs/${org}/servers/${sid}/sites/${site.id}/deployments`, 1);
    const d = deps.map((x) => ({ at: String(attr(x, "created_at", "createdAt", "started_at") ?? ""), status: String(attr(x, "status") ?? "") })).filter((x) => x.at).sort((a, b) => (a.at < b.at ? 1 : -1))[0];
    if (d) lastDeploy = { date: d.at.slice(0, 10) as IsoDate, ok: /^(finished|success|successful|deployed)$/i.test(d.status) };
  }
  const php = attr(server, "php_version", "phpVersion");
  const forge = ok<Server>({
    name: attr(server, "name"), connected: (() => { const c = attr(server, "connection_status", "connectionStatus"); return c === null ? null : c === "successful"; })(),
    php: php ? String(php).replace(/^php(\d)(\d+)$/i, "$1.$2") : null, ubuntu: attr(server, "ubuntu_version", "ubuntuVersion"),
    diskPct: null, securityUpdates: null, siteStatus: site ? attr(site, "status") : null, lastDeploy,
  });

  // Backups: count distinct days in the month with at least one successful backup.
  const configs = await list(ctx, token, `/orgs/${org}/servers/${sid}/database/backups`, 1);
  if (!configs.length) return { forge, backups: unavailable("no database backups configured in Forge") };
  const okDays = new Set<number>();
  for (const cfg of configs) {
    const inst = await list(ctx, token, `/orgs/${org}/servers/${sid}/database/backups/${cfg.id}/instances`, 3);
    for (const i of inst) {
      const at = String(attr(i, "created_at", "createdAt") ?? "");
      if (at.slice(0, 7) === ctx.month && /^(success|successful|finished|completed)$/i.test(String(attr(i, "status") ?? ""))) okDays.add(Number(at.slice(8, 10)));
    }
  }
  const lastDay = ctx.asOf.slice(0, 7) === ctx.month ? Number(ctx.asOf.slice(8, 10)) : daysInMonth(ctx.month);
  const all = Array.from({ length: lastDay }, (_, i) => i + 1);
  return { forge, backups: ok({ ok: all.filter((d) => okDays.has(d)).length, total: all.length, daysMissed: all.filter((d) => !okDays.has(d)), restoreTest: null }) };
}
