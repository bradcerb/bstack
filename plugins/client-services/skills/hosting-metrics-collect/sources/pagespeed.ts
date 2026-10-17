// Google PageSpeed Insights API: mobile performance score, median of N runs (lab runs vary).
import { median } from "../../../lib/format";
import type { PageSpeed } from "../../../lib/snapshot";
import { type Ctx, ok, round, type SourceResult, unavailable } from "./types";

export async function collectPageSpeed(ctx: Ctx): Promise<SourceResult<PageSpeed>> {
  const key = ctx.keys.pagespeed;
  if (!ctx.site.pagespeed) return unavailable("not configured for this site");
  if (!key) return unavailable(ctx.keyMissing("pagespeed"));
  const runs = ctx.site.pagespeed.runs ?? 3, strategy = ctx.site.pagespeed.strategy ?? "mobile";
  const res: { score: number; lcp: number | null; cls: number | null; tbt: number | null }[] = [];
  for (let i = 0; i < runs; i++) {
    const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(ctx.site.url)}&strategy=${strategy}&category=performance&key=${encodeURIComponent(key)}`;
    const r = await ctx.http(url, { timeoutMs: 120000 });
    const lr = r.json?.lighthouseResult;
    if (r.status !== 200 || typeof lr?.categories?.performance?.score !== "number") throw new Error(`PageSpeed HTTP ${r.status}`);
    const num = (id: string) => (typeof lr.audits?.[id]?.numericValue === "number" ? lr.audits[id].numericValue : null);
    res.push({ score: Math.round(lr.categories.performance.score * 100), lcp: num("largest-contentful-paint"), cls: num("cumulative-layout-shift"), tbt: num("total-blocking-time") });
  }
  const med = (xs: (number | null)[]) => { const v = xs.filter((x): x is number => x !== null); return v.length ? median(v) : null; };
  const lcp = med(res.map((x) => x.lcp)), cls = med(res.map((x) => x.cls)), tbt = med(res.map((x) => x.tbt));
  return ok({ score: Math.round(median(res.map((x) => x.score))), runs: res.map((x) => x.score), lcpSec: lcp === null ? null : round(lcp / 1000, 2), cls: cls === null ? null : round(cls, 3), tbtMs: tbt === null ? null : Math.round(tbt) });
}
