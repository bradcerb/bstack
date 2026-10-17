// email-send core and CLI. Network boundary for outgoing mail. send() accepts only an ApprovedDraft, which
// only approval-stage can issue, and refuses a key already in the ledger. The Resend idempotency key equals
// the ledger key, so a retry after a crash cannot deliver twice either.
// Usage: tsx send.ts --dir <draft dir> [--config <workspace.json>] [--live | --mocks <routes.json> [--simulate-approval]]
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Http, RecordedCall } from "../../lib/http";
import { approvalsTarget, httpFor, keyFor, saveCalls, statusesFrom } from "../../lib/cli";
import { parseArgs, runCli, writeFile, writeJson } from "../../lib/io";
import { loadWorkspace, resolvePath, setting } from "../../lib/workspace";
import { assertApproved, markSent, simulatedReviewer, verifyApproval, type ApprovedDraft } from "../approval-stage/approval";

export interface LedgerEntry { key: string; draftHash: string; emailId: string; to: string[]; sentAt: string; mode: "live" | "dry-run" }
export type SendResult =
  | { status: "sent"; emailId: string }
  | { status: "skipped"; reason: string; emailId?: string }
  | { status: "blocked"; reason: string };

const PLACEHOLDER = /PLACEHOLDER|REPLACE_WITH|example\.invalid/i;

export function readLedger(path: string): LedgerEntry[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

export function resendBody(d: ApprovedDraft) {
  return {
    from: d.envelope.from, to: d.envelope.to, ...(d.envelope.replyTo ? { reply_to: d.envelope.replyTo } : {}), subject: d.subject, html: d.html, text: d.text,
    attachments: d.images.map((i) => ({ filename: i.filename, content: i.content.toString("base64"), content_id: i.cid })),
  };
}

export async function send(d: ApprovedDraft, o: { http: Http; apiKey: string; ledgerPath: string; live: boolean; now?: () => string }): Promise<SendResult> {
  assertApproved(d);
  const prior = readLedger(o.ledgerPath).find((e) => e.key === d.key);
  if (prior) return prior.draftHash === d.draftHash
    ? { status: "skipped", reason: "already sent (found in send ledger)", emailId: prior.emailId }
    : { status: "blocked", reason: "this key was already sent with different content; a changed draft is never sent under the same key" };
  const blockers = [d.envelope.from, d.envelope.replyTo ?? "", ...d.envelope.to].filter((x) => PLACEHOLDER.test(x));
  if (o.live && blockers.length) return { status: "blocked", reason: `placeholder address in envelope: ${blockers.length}` };
  const r = await o.http("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${o.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": d.key },
    body: JSON.stringify(resendBody(d)),
  });
  if (r.status !== 200 || typeof r.json?.id !== "string") throw new Error(`Resend send failed (HTTP ${r.status}${r.json?.message ? `: ${String(r.json.message).slice(0, 120)}` : ""})`);
  const entry: LedgerEntry = { key: d.key, draftHash: d.draftHash, emailId: r.json.id, to: [...d.envelope.to], sentAt: (o.now ?? (() => new Date().toISOString()))(), mode: o.live ? "live" : "dry-run" };
  writeFile(o.ledgerPath, existsSync(o.ledgerPath) ? readFileSync(o.ledgerPath) : "");
  appendFileSync(o.ledgerPath, JSON.stringify(entry) + "\n");
  return { status: "sent", emailId: r.json.id };
}

if (require.main === module) runCli(async () => {
  const a = parseArgs();
  const ws = loadWorkspace(typeof a.config === "string" ? a.config : undefined);
  if (typeof a.dir !== "string") throw new Error("missing --dir");
  const dir = a.dir, live = a.live === true;
  approvalsTarget(ws);
  const statuses = statusesFrom(ws);
  const calls: RecordedCall[] = [];
  let http = httpFor(a, calls);
  if (a["simulate-approval"] === true) http = simulatedReviewer(http, dir, statuses);
  const notion = keyFor(ws, "notion", live);
  const ledgerPath = live ? resolvePath(ws, setting<string>(ws, "email_send.ledger_file")) : join(dir, "send-ledger.dry-run.jsonl");
  const check = await verifyApproval({ dir, http, token: notion, statuses });
  let result: SendResult;
  if (!check.ok) result = { status: "skipped", reason: check.reason };
  else {
    result = await send(check.draft, { http, apiKey: keyFor(ws, "resend", live), ledgerPath, live });
    if (result.status === "sent") await markSent(check.draft, { http, token: notion, statuses });
  }
  writeJson(join(dir, "send.json"), { schema: "email-send-result", version: 1, mode: live ? "live" : "dry-run", ...result });
  if (!live) saveCalls(dir, "send", calls);
  console.log(`email-send (${live ? "live" : "dry run"}): ${result.status}${"reason" in result ? `, ${result.reason}` : ""}`);
});
