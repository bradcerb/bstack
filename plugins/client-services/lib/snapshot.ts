// hosting-snapshot v1: one site, one month, frozen once written. Parsed with the schema on every read.
import { join } from "node:path";
import type { IsoDate, Month, SiteId } from "./ids";
import { parseMonth, parseSiteId } from "./ids";
import type { SourceStatus } from "./result";
import { loadSchema, parseWith } from "./schema";

export const SNAPSHOT_SCHEMA_FILE = join(__dirname, "..", "schemas", "snapshot.v1.schema.json");
export const SOURCE_NAMES = ["uptimerobot", "pagespeed", "ttfb", "ssl", "rdap", "forge", "forgeBackups", "stripe"] as const;
export type SourceName = (typeof SOURCE_NAMES)[number];

export interface Uptime { pct: number; incidents: number; downMinutes: number; incidentDays: number[] }
export interface Ttfb { medianSec: number; runsSec: number[] }
export interface PageSpeed { score: number; runs: number[]; lcpSec: number | null; cls: number | null; tbtMs: number | null }
export interface Ssl { expires: IsoDate; daysLeft: number; issuer: string; issuedOn: IsoDate | null }
export interface DomainRegistration { expires: IsoDate; daysLeft: number; registrar: string | null }
export interface Server {
  name: string | null; connected: boolean | null; php: string | null; ubuntu: string | null; diskPct: number | null;
  securityUpdates: number | null; siteStatus: string | null; lastDeploy: { date: IsoDate; ok: boolean } | null;
}
export interface Backups { ok: number; total: number; daysMissed: number[]; restoreTest: { date: IsoDate; passed: boolean } | null }
export type { IsoDate };
export interface Billing { state: "paid" | "processing" | "failed" | "none"; invoiceDate: IsoDate | null; amount: number | null; currency: string | null; subscriptionStatus: string | null }
export interface Errors { errors5xx: number; brokenPages: number }

export interface Snapshot {
  schema: "hosting-snapshot";
  version: 1;
  siteId: SiteId;
  domain: string;
  month: Month;
  collectedAt: string | null;
  sources: Partial<Record<SourceName, SourceStatus>>;
  uptime: Uptime | null;
  ttfb: Ttfb | null;
  pagespeed: PageSpeed | null;
  ssl: Ssl | null;
  domainRegistration: DomainRegistration | null;
  server: Server | null;
  backups: Backups | null;
  billing: Billing | null;
  errors: Errors | null;
}

export function parseSnapshot(value: unknown, what = "snapshot"): Snapshot {
  const s = parseWith<Snapshot>(value, loadSchema(SNAPSHOT_SCHEMA_FILE), what);
  parseSiteId(s.siteId);
  parseMonth(s.month);
  return s;
}
