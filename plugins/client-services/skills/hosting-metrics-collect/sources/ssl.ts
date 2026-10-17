// SSL certificate expiry and issuer with openssl. No key needed.
import { parseIsoDate } from "../../../lib/ids";
import { daysBetween } from "../../../lib/months";
import type { Ssl } from "../../../lib/snapshot";
import { type Ctx, ok, safeDomain, type SourceResult } from "./types";

const MON: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
// "Nov 12 01:42:04 2026 GMT" -> "2026-11-12"
export function opensslDate(s: string) {
  const m = /^([A-Z][a-z]{2})\s+(\d{1,2})\s+[\d:]+\s+(\d{4})/.exec(s.trim());
  if (!m || !MON[m[1]]) throw new Error(`cannot read certificate date: ${s}`);
  return `${m[3]}-${MON[m[1]]}-${m[2].padStart(2, "0")}`;
}
export function parseCert(out: string) {
  const get = (k: string) => new RegExp(`^${k}=(.*)$`, "m").exec(out)?.[1]?.trim();
  const end = get("notAfter"), start = get("notBefore"), issuer = get("issuer") ?? "";
  if (!end) throw new Error("openssl returned no certificate");
  const org = /(?:^|,\s*|\/)O\s*=\s*([^,/]+)/.exec(issuer)?.[1]?.trim() ?? issuer;
  return { expires: opensslDate(end), issuedOn: start ? opensslDate(start) : null, issuer: org };
}
export async function collectSsl(ctx: Ctx): Promise<SourceResult<Ssl>> {
  const d = safeDomain(ctx.site.domain);
  const out = await ctx.exec("sh", ["-c", `echo | openssl s_client -connect ${d}:443 -servername ${d} 2>/dev/null | openssl x509 -noout -startdate -enddate -issuer`]);
  const c = parseCert(out);
  return ok({ expires: parseIsoDate(c.expires), daysLeft: daysBetween(ctx.asOf, c.expires), issuer: c.issuer, issuedOn: c.issuedOn === null ? null : parseIsoDate(c.issuedOn) });
}
