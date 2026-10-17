import type { Site } from "../../../lib/config";
import type { Http } from "../../../lib/http";
import type { IsoDate, Month } from "../../../lib/ids";

export type Exec = (cmd: string, args: string[]) => Promise<string>;
export type KeyName = "uptimerobot" | "pagespeed" | "forge" | "stripe";
// keys holds values read from the env vars named in workspace.json secrets. keyMissing explains why one is absent.
export interface Ctx {
  site: Site;
  month: Month;
  asOf: IsoDate;
  http: Http;
  exec: Exec;
  keys: Partial<Record<KeyName, string>>;
  keyMissing: (k: KeyName) => string;
}
export { ok, unavailable, failed, type SourceResult } from "../../../lib/result";

// Strict domain check before a domain is passed to a shell command.
export const safeDomain = (d: string) => {
  if (!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(d)) throw new Error(`unsafe domain: ${d}`);
  return d;
};
export const round = (n: number, d: number) => Math.round(n * 10 ** d) / 10 ** d;
export const isoDate = (unixSec: number) => new Date(unixSec * 1000).toISOString().slice(0, 10) as IsoDate;
