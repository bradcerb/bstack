// hosting-snapshot-diff: snapshots (this month + earlier months) -> model.json + review-note.md. Pure and offline:
// it reads files and writes files, nothing else. Every snapshot is schema-checked on read; the model on write.
// Usage: tsx diff.ts --site <id> --month <YYYY-MM> [--config <workspace.json>] [--out <dir>]
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { findSite, hostingSettings, loadCopy, loadSites, sitesFile, thresholds } from "../../lib/config";
import { parseMonth, parseSiteId, type Month, type SiteId } from "../../lib/ids";
import { parseArgs, runCli, sha256, writeFile, writeJson } from "../../lib/io";
import { parseModel } from "../../lib/model";
import { parseSnapshot, type Snapshot } from "../../lib/snapshot";
import { loadWorkspace, resolvePath } from "../../lib/workspace";
import { reviewNote } from "./review-note";
import { buildModel } from "./rules";

export function loadSnapshots(dir: string, siteId: SiteId, month: Month, historyMonths: number): { snapshots: Snapshot[]; inputs: { month: string; sha256: string }[] } {
  const re = new RegExp(`^snapshot-${siteId}-(\\d{4}-\\d{2})\\.json$`);
  const files = readdirSync(dir)
    .map((f) => ({ f, m: re.exec(f)?.[1] }))
    .filter((x): x is { f: string; m: string } => !!x.m && x.m <= month)
    .sort((a, b) => (a.m < b.m ? -1 : 1))
    .slice(-historyMonths);
  if (!files.length || files[files.length - 1].m !== month) throw new Error(`no snapshot for ${siteId} ${month} in ${dir}`);
  const snapshots: Snapshot[] = [], inputs: { month: string; sha256: string }[] = [];
  for (const { f, m } of files) {
    const bytes = readFileSync(join(dir, f));
    const snap = parseSnapshot(JSON.parse(bytes.toString("utf8")), f);
    if (snap.siteId !== siteId || snap.month !== m) throw new Error(`${f}: siteId/month inside the file do not match its name`);
    snapshots.push(snap);
    inputs.push({ month: m, sha256: sha256(bytes) });
  }
  return { snapshots, inputs };
}

export const reportDir = (reportsDir: string, siteId: SiteId, month: Month) => join(reportsDir, siteId, month);

if (require.main === module) runCli(() => {
  const a = parseArgs();
  const ws = loadWorkspace(typeof a.config === "string" ? a.config : undefined);
  const h = hostingSettings(ws);
  const siteId = parseSiteId(a.site), month = parseMonth(a.month);
  const site = findSite(loadSites(sitesFile(ws)), siteId);
  const t = thresholds(h);
  const { snapshots, inputs } = loadSnapshots(resolvePath(ws, h.snapshots_dir), siteId, month, t.historyMonths);
  const model = parseModel(buildModel({ site, snapshots, thresholds: t, copy: loadCopy(ws, h), sender: { name: h.sender_name, projectUrl: h.project_url }, inputs }), "built model");
  const out = typeof a.out === "string" ? a.out : reportDir(resolvePath(ws, h.reports_dir), siteId, month);
  writeJson(join(out, "model.json"), model);
  writeFile(join(out, "review-note.md"), reviewNote(model));
  console.log(`model written: ${join(out, "model.json")} (${model.highlights.length} charts, ${model.attention.length} asks)`);
});
