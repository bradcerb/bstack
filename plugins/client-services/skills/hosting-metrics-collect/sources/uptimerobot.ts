// UptimeRobot (v2 API, read-only key): uptime % for the month, down incidents, minutes down.
import { isPlaceholder } from "../../../lib/config";
import { monthBounds } from "../../../lib/months";
import type { Uptime } from "../../../lib/snapshot";
import { type Ctx, ok, round, type SourceResult, unavailable } from "./types";

export async function collectUptime(ctx: Ctx): Promise<SourceResult<Uptime>> {
  const key = ctx.keys.uptimerobot;
  const monitorUrl = ctx.site.uptimerobot?.monitorUrl;
  if (!monitorUrl || isPlaceholder(monitorUrl)) return unavailable("not configured for this site");
  if (!key) return unavailable(ctx.keyMissing("uptimerobot"));
  const { start, end } = monthBounds(ctx.month);
  const form = new URLSearchParams({ api_key: key, format: "json", logs: "1", logs_start_date: String(start), logs_end_date: String(end - 1), custom_uptime_ranges: `${start}_${end - 1}` });
  const r = await ctx.http("https://api.uptimerobot.com/v2/getMonitors", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() });
  if (r.status !== 200 || r.json?.stat !== "ok") throw new Error(`UptimeRobot HTTP ${r.status}${r.json?.error?.message ? `: ${r.json.error.message}` : ""}`);
  const norm = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
  const mon = (r.json.monitors ?? []).find((m: any) => norm(m.url ?? "") === norm(monitorUrl));
  if (!mon) return unavailable(`no monitor for ${monitorUrl}`);
  const pct = Number(String(mon.custom_uptime_ranges ?? "").split("-")[0]);
  if (!Number.isFinite(pct)) throw new Error("UptimeRobot returned no uptime ratio");
  const downs = (mon.logs ?? []).filter((l: any) => l.type === 1 && l.datetime >= start && l.datetime < end);
  const downSec = downs.reduce((s: number, l: any) => s + (Number(l.duration) || 0), 0);
  const days = [...new Set(downs.map((l: any) => new Date(l.datetime * 1000).getUTCDate()))].sort((a: any, b: any) => a - b) as number[];
  return ok({ pct: round(pct, 3), incidents: downs.length, downMinutes: Math.round(downSec / 60), incidentDays: days });
}
