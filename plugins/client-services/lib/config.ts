// Hosting config from workspace.json: the sites file (source hosting.sites), the hosting settings block,
// thresholds (defaults here, overrides in hosting.thresholds), and copy (package default or hosting.copy_file).
// Every file is schema-checked when read. Person, brand and client details live only in the user's files.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import defaultCopy from "../copy/copy.en.json";
import { parseSiteId, type SiteId } from "./ids";
import { loadSchema, parseWith } from "./schema";
import { resolvePath, setting, sourceFile, type Workspace } from "./workspace";

const SCHEMAS = join(__dirname, "..", "schemas");

export interface Site {
  id: SiteId;
  enabled: boolean;
  domain: string;
  url: string;
  greetingNames: string;
  contacts: { name: string; email: string }[];
  domainManagedBy?: string | null;
  uptimerobot?: { monitorUrl?: string } | null;
  pagespeed?: { strategy?: "mobile" | "desktop"; runs?: number } | null;
  ttfb?: { runs?: number } | null;
  forge?: { organization?: string; server?: string; site?: string } | null;
  stripe?: { subscriptionId?: string } | null;
}

// A value still holding a placeholder counts as "not configured".
export const isPlaceholder = (v: unknown) => typeof v !== "string" || !v || /PLACEHOLDER|REPLACE_WITH|example\.invalid/i.test(v);

export function loadSites(path: string): Site[] {
  if (!existsSync(path)) throw new Error(`sites file not found: ${path}`);
  const doc = parseWith<{ sites: Site[] }>(JSON.parse(readFileSync(path, "utf8")), loadSchema(join(SCHEMAS, "sites.v1.schema.json")), path);
  const ids = doc.sites.map((s) => parseSiteId(s.id));
  if (new Set(ids).size !== ids.length) throw new Error(`${path}: site ids must be unique`);
  return doc.sites;
}
export function findSite(sites: Site[], id: SiteId): Site {
  const s = sites.find((x) => x.id === id);
  if (!s) throw new Error(`site "${id}" not found`);
  return s;
}

export const DEFAULT_THRESHOLDS = {
  uptimeTargetPct: 99.9,
  ttfbGoodSec: 0.8,
  perfGoodScore: 90,
  sslWarnDays: 14,
  domainWarnDays: 60,
  diskWarnPct: 80,
  diskNearPct: 70,
  backupMissWarn: 1,
  uptimeChartMinPct: 99.5,
  historyMonths: 6,
  minMonthsForChart: 2,
  maxAttention: 2,
  maxCharts: 3,
};
export type Thresholds = typeof DEFAULT_THRESHOLDS;
export type Copy = typeof defaultCopy;

export interface HostingSettings {
  snapshots_dir: string;
  reports_dir: string;
  sender_name: string;
  project_url: string;
  render_kit_dir?: string;
  render_brand_file?: string;
  agent_ops_dir?: string;
  thresholds?: Partial<Thresholds>;
  copy_file?: string;
}

// The whole hosting block is checked against its schema; unknown keys and wrong types fail loudly.
export function hostingSettings(ws: Workspace): HostingSettings {
  return parseWith<HostingSettings>(setting(ws, "hosting"), loadSchema(join(SCHEMAS, "hosting-settings.v1.schema.json")), `${ws.file} hosting`);
}

export function thresholds(h: HostingSettings): Thresholds {
  return { ...DEFAULT_THRESHOLDS, ...(h.thresholds ?? {}) };
}

// Same keys as the package default, all strings: wording can change, structure cannot.
function sameShape(a: unknown, b: unknown, path: string, errs: string[]) {
  if (typeof b === "string") {
    if (typeof a !== "string") errs.push(`${path}: expected text`);
    else if (a.includes("\u2014")) errs.push(`${path}: em-dash`);
    return;
  }
  if (typeof b !== "object" || b === null) {
    if (a !== b) errs.push(`${path}: must be ${JSON.stringify(b)}`);
    return;
  }
  if (!a || typeof a !== "object") return void errs.push(`${path}: expected an object`);
  for (const k of Object.keys(b as object)) if (k !== "_about") sameShape((a as any)[k], (b as any)[k], `${path}.${k}`, errs);
  for (const k of Object.keys(a as object)) if (!(k in (b as object))) errs.push(`${path}.${k}: unknown key`);
}
export function loadCopy(ws: Workspace, h: HostingSettings): Copy {
  if (!h.copy_file) return defaultCopy;
  const p = resolvePath(ws, h.copy_file);
  const c = JSON.parse(readFileSync(p, "utf8"));
  const errs: string[] = [];
  sameShape(c, defaultCopy, "$", errs);
  if (errs.length) throw new Error(`${p} does not match the default copy structure:\n  ${errs.slice(0, 20).join("\n  ")}`);
  return c as Copy;
}

export const sitesFile = (ws: Workspace) => sourceFile(ws, "hosting.sites");
