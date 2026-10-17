// Shared CLI plumbing for approval-stage and email-send: live vs dry-run HTTP, keys from workspace secrets,
// and a saved request log for dry runs (secrets redacted, inline image bytes replaced by their hash).
import { join } from "node:path";
import { mockHttp, realHttp, type Http, type RecordedCall } from "./http";
import { sha256, writeJson } from "./io";
import { secretValue, setting, source, type Workspace } from "./workspace";
import { DEFAULT_STATUSES, type Statuses } from "../skills/approval-stage/approval";

export function httpFor(a: Record<string, string | boolean>, calls: RecordedCall[]): Http {
  if (a.live === true) {
    if (typeof a.mocks === "string" || a["simulate-approval"] === true) throw new Error("--live cannot be combined with --mocks or --simulate-approval");
    return realHttp;
  }
  return mockHttp(typeof a.mocks === "string" ? a.mocks : null, calls);
}

// Live runs need the real key; dry runs never read it.
export function keyFor(ws: Workspace, name: string, live: boolean): string {
  if (!live) return "dry-run-no-key";
  const s = secretValue(ws, name);
  if (!s.env) throw new Error(`workspace.json has no secrets.${name} entry (needed for --live)`);
  if (!s.value) throw new Error(`${s.env} is not set (needed for --live)`);
  return s.value;
}

export function approvalsTarget(ws: Workspace): string {
  const b = source(ws, "approvals.pages")!;
  if (b.via !== "connector" || !b.target) throw new Error("source approvals.pages must be a connector binding whose target is the approvals database id");
  return b.target;
}

export const statusesFrom = (ws: Workspace): Statuses => ({ ...DEFAULT_STATUSES, ...(setting<Partial<Statuses>>(ws, "approvals.statuses", { optional: true }) ?? {}) });

export function saveCalls(dir: string, step: string, calls: RecordedCall[]) {
  const slim = calls.map((c) => {
    const b = c.body;
    const body = b && Array.isArray(b.attachments)
      ? { ...b, html: `sha256:${sha256(b.html)}`, attachments: b.attachments.map((x: any) => ({ ...x, content: `sha256:${sha256(Buffer.from(x.content, "base64"))}` })) }
      : b;
    return { ...c, body };
  });
  writeJson(join(dir, `requests.${step}.dry-run.json`), slim);
}
