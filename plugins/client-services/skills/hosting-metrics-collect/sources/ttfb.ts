// Server response time (time to first byte) with curl, median of N runs. No key needed.
import { median } from "../../../lib/format";
import type { Ttfb } from "../../../lib/snapshot";
import { type Ctx, ok, round, type SourceResult, unavailable } from "./types";

export async function collectTtfb(ctx: Ctx): Promise<SourceResult<Ttfb>> {
  if (!ctx.site.ttfb) return unavailable("not configured for this site");
  const runs = ctx.site.ttfb.runs ?? 3;
  const url = new URL(ctx.site.url).toString();
  const out: number[] = [];
  for (let i = 0; i < runs; i++) {
    const s = await ctx.exec("curl", ["-o", "/dev/null", "-s", "--max-time", "30", "-w", "%{http_code} %{time_starttransfer}", url]);
    const [code, t] = s.trim().split(/\s+/);
    if (!/^[23]\d\d$/.test(code) || !Number.isFinite(Number(t))) throw new Error(`curl got HTTP ${code}`);
    out.push(round(Number(t), 3));
  }
  return ok({ medianSec: round(median(out), 3), runsSec: out });
}
