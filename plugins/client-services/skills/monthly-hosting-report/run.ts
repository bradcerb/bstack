// monthly-hosting-report: runs the chain for one month, one site or all enabled sites. Each step is its own
// CLI; this file only passes paths between them and stops at the first failure.
//   collect (network) -> diff (pure) -> email-render (pure, render kit repo) -> approval-stage build + stage -> email-send
// Nothing is created or sent without --live. email-send refuses anything not approved on its review page.
// Usage: tsx run.ts --month <YYYY-MM> [--site <id>|all] [--config <workspace.json>] [--skip-collect] [--force] [--as-of YYYY-MM-DD]
//        [--mocks <collect routes.json>] [--exec-mocks <exec.json>] [--send-mocks <routes.json>] [--simulate-approval] [--banner <text>] [--live]
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { hostingSettings, loadSites, sitesFile, type HostingSettings } from "../../lib/config";
import { monthYear } from "../../lib/format";
import { parseMonth, type Month } from "../../lib/ids";
import { parseArgs, runCli, sha256 } from "../../lib/io";
import { MODEL_SCHEMA_FILE } from "../../lib/model";
import { loadWorkspace, resolvePath, type Workspace } from "../../lib/workspace";
import { reportDir } from "../hosting-snapshot-diff/diff";

const SKILLS = resolve(__dirname, "..");
const KIT_SCHEMA = "lib/hosting-report/hosting-report-model.v1.schema.json";

function tsx(cwd: string, script: string, args: string[]) {
  const cli = join(cwd, "node_modules", "tsx", "dist", "cli.mjs");
  if (!existsSync(cli)) throw new Error(`run npm ci in ${cwd} first (tsx not installed there)`);
  process.stdout.write(execFileSync(process.execPath, [cli, script, ...args], { cwd, encoding: "utf8", env: process.env }));
}

// The model schema is copied in both repos. Refuse to run when the copies differ.
export function checkRenderKit(ws: Workspace, h: HostingSettings): { kit: string; brand: string } {
  if (!h.render_kit_dir || !h.render_brand_file) throw new Error("workspace.json: set hosting.render_kit_dir and hosting.render_brand_file (the email render kit checkout and its brand file)");
  const kit = resolvePath(ws, h.render_kit_dir), brand = resolvePath(ws, h.render_brand_file);
  const theirs = join(kit, KIT_SCHEMA);
  if (!existsSync(theirs)) throw new Error(`render kit not found at ${kit} (missing ${KIT_SCHEMA})`);
  if (sha256(readFileSync(theirs)) !== sha256(readFileSync(MODEL_SCHEMA_FILE))) throw new Error(`hosting-report-model schema differs between this plugin and ${kit}; update both copies together`);
  if (!existsSync(brand)) throw new Error(`email brand file not found: ${brand}`);
  return { kit, brand };
}

if (require.main === module) runCli(() => {
  const a = parseArgs();
  const config = typeof a.config === "string" ? resolve(a.config) : undefined;
  const ws = loadWorkspace(config);
  const h = hostingSettings(ws);
  const month: Month = parseMonth(a.month);
  const { kit, brand } = checkRenderKit(ws, h);
  const agentOps = resolvePath(ws, h.agent_ops_dir ?? join(SKILLS, "..", "..", "agent-ops"));
  const which = typeof a.site === "string" ? a.site : "all";
  const sites = loadSites(sitesFile(ws)).filter((s) => s.enabled && (which === "all" || s.id === which));
  if (!sites.length) throw new Error(`no enabled site matches "${which}"`);
  const pass = (k: string, as = k) => (typeof a[k] === "string" ? [`--${as}`, a[k] as string] : a[k] === true ? [`--${as}`] : []);
  const cfg = ["--config", ws.file];
  const plugin = resolve(SKILLS, "..");
  for (const s of sites) {
    const dir = reportDir(resolvePath(ws, h.reports_dir), s.id, month);
    console.log(`\n== ${s.id} ${month} ==`);
    if (a["skip-collect"] !== true) tsx(plugin, join(SKILLS, "hosting-metrics-collect/collect.ts"), ["--site", s.id, "--month", month, ...cfg, ...pass("as-of"), ...pass("mocks"), ...pass("exec-mocks"), ...pass("force")]);
    tsx(plugin, join(SKILLS, "hosting-snapshot-diff/diff.ts"), ["--site", s.id, "--month", month, "--out", dir, ...cfg]);
    tsx(kit, join(kit, "scripts/render.tsx"), ["--template", "hosting-report", "--data", join(dir, "model.json"), "--brand", brand, "--out", dir, ...pass("banner")]);
    const stage = join(agentOps, "skills/approval-stage/stage.ts");
    tsx(agentOps, stage, ["build", "--dir", dir, "--key", `hosting-report/${s.id}/${month}`, "--to", s.contacts.map((c) => c.email).join(","), "--note", join(dir, "review-note.md"), ...cfg]);
    tsx(agentOps, stage, ["stage", "--dir", dir, "--title", `${s.domain} · ${monthYear(month)}`, ...cfg, ...pass("send-mocks", "mocks"), ...pass("live")]);
    tsx(agentOps, join(agentOps, "skills/email-send/send.ts"), ["--dir", dir, ...cfg, ...pass("send-mocks", "mocks"), ...pass("live"), ...pass("simulate-approval")]);
  }
});
