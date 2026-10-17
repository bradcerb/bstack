import { readFileSync } from "node:fs";
import { join } from "node:path";
import defaultCopy from "../copy/copy.en.json";
import { DEFAULT_THRESHOLDS, type Copy } from "../lib/config";
import { parseSiteId } from "../lib/ids";
import { parseSnapshot, type Snapshot } from "../lib/snapshot";
export const KIT = join(__dirname, "..");
export const EXAMPLES = join(KIT, "examples");
export const WORKSPACE = join(EXAMPLES, "workspace.example.json");
export const readJ = (p: string) => JSON.parse(readFileSync(p, "utf8"));
export const thresholds = () => ({ ...DEFAULT_THRESHOLDS });
export const copy = (): Copy => JSON.parse(JSON.stringify(defaultCopy));
export const sender = { name: "Sender", projectUrl: "https://example.com/projects" };
export const site = { id: parseSiteId("s1"), domain: "example.com", greetingNames: "Ann", domainManagedBy: null as string | null };
export const exampleSnaps = () => ["05", "06", "07", "08", "09", "10"].map((m) => parseSnapshot(readJ(join(EXAMPLES, "snapshots", `snapshot-example-2026-${m}.json`))));
// A complete, all-healthy snapshot to mutate in tests.
export function snap(month: string, over: Record<string, any> = {}): Snapshot {
  return parseSnapshot({
    schema: "hosting-snapshot", version: 1, siteId: "s1", domain: "example.com", month, collectedAt: null,
    sources: { uptimerobot: { status: "ok" }, pagespeed: { status: "ok" }, ttfb: { status: "ok" }, ssl: { status: "ok" }, rdap: { status: "ok" }, forge: { status: "ok" }, stripe: { status: "ok" } },
    uptime: { pct: 100, incidents: 0, downMinutes: 0, incidentDays: [] },
    ttfb: { medianSec: 0.3, runsSec: [0.3, 0.3, 0.3] },
    pagespeed: { score: 95, runs: [95, 95, 95], lcpSec: 1.5, cls: 0, tbtMs: 10 },
    ssl: { expires: "2027-03-01", daysLeft: 80, issuer: "Let's Encrypt", issuedOn: "2026-01-01" },
    domainRegistration: { expires: "2027-09-01", daysLeft: 300, registrar: "R" },
    server: { name: "srv", connected: true, php: "8.4", ubuntu: "24.04", diskPct: 40, securityUpdates: 0, siteStatus: "installed", lastDeploy: null },
    backups: { ok: 30, total: 30, daysMissed: [], restoreTest: null },
    billing: { state: "paid", invoiceDate: `${month}-05`, amount: 35, currency: "usd", subscriptionStatus: "active" },
    errors: { errors5xx: 0, brokenPages: 0 },
    ...over,
  });
}
