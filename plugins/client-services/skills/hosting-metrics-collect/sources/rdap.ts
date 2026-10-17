// Domain expiry and registrar from public RDAP (rdap.org redirects to the right registry). No key needed.
import { parseIsoDate } from "../../../lib/ids";
import { daysBetween } from "../../../lib/months";
import type { DomainRegistration } from "../../../lib/snapshot";
import { type Ctx, ok, safeDomain, type SourceResult } from "./types";

export async function collectRdap(ctx: Ctx): Promise<SourceResult<DomainRegistration>> {
  const r = await ctx.http(`https://rdap.org/domain/${safeDomain(ctx.site.domain)}`, { headers: { Accept: "application/rdap+json, application/json", "User-Agent": "hosting-metrics-collect/1.0" } });
  if (r.status !== 200 || !r.json) throw new Error(`RDAP HTTP ${r.status}`);
  const exp = (r.json.events ?? []).find((e: any) => e.eventAction === "expiration")?.eventDate;
  if (!exp) throw new Error("RDAP has no expiration date");
  const reg = (r.json.entities ?? []).find((e: any) => (e.roles ?? []).includes("registrar"));
  const fn = reg?.vcardArray?.[1]?.find((v: any) => v[0] === "fn")?.[3] ?? null;
  const expires = parseIsoDate(String(exp).slice(0, 10));
  return ok({ expires, daysLeft: daysBetween(ctx.asOf, expires), registrar: fn });
}
