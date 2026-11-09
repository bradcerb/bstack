// approval-stage CLI. Three steps, each runs on its own:
//   build : rendered.json folder + envelope -> draft.json (draftHash covers recipients and every file)
//   stage : one review page per draftHash in the approvals database (dry run unless --live)
//   check : prints "approved" only when the page says Approved and its hash matches the draft on disk
// Usage: tsx stage.ts build --dir <dir> --key <idempotency key> --to <a@x,b@y> [--note <file>] [--config <workspace.json>]
//        tsx stage.ts stage --dir <dir> --title <text> [--live | --mocks <routes.json>]
//        tsx stage.ts check --dir <dir> [--live | --mocks <routes.json> [--simulate-approval]]
import type { RecordedCall } from "../../lib/http";
import { approvalsTarget, httpFor, keyFor, saveCalls, statusesFrom } from "../../lib/cli";
import { parseArgs, runCli } from "../../lib/io";
import { loadWorkspace, setting } from "../../lib/workspace";
import { buildDraft, simulatedReviewer, stage, verifyApproval } from "./approval";

const str = (a: Record<string, string | boolean>, k: string) => {
  const v = a[k];
  if (typeof v !== "string" || !v) throw new Error(`missing --${k}`);
  return v;
};

if (require.main === module) runCli(async () => {
  const [step, ...rest] = process.argv.slice(2);
  const a = parseArgs(rest);
  const ws = loadWorkspace(typeof a.config === "string" ? a.config : undefined);
  const dir = str(a, "dir");
  const live = a.live === true;
  const calls: RecordedCall[] = [];
  if (step === "build") {
    const to = str(a, "to").split(",").map((s) => s.trim()).filter(Boolean);
    const d = buildDraft({ dir, key: str(a, "key"), envelope: { from: setting<string>(ws, "email_send.from"), to, replyTo: setting<string>(ws, "email_send.reply_to", { optional: true }) ?? null }, notePath: typeof a.note === "string" ? a.note : undefined });
    console.log(`draft built: ${d.key} ${d.draftHash.slice(0, 12)} to ${d.envelope.to.length} recipient(s)`);
  } else if (step === "stage") {
    const r = await stage({ dir, http: httpFor(a, calls), token: keyFor(ws, "notion", live), databaseId: approvalsTarget(ws), statuses: statusesFrom(ws), title: str(a, "title"), live });
    if (!live) saveCalls(dir, "stage", calls);
    console.log(r.skipped ? `stage: ${r.skipped}` : `staged for review (${r.mode}): page ${r.pageId}`);
  } else if (step === "check") {
    const statuses = statusesFrom(ws);
    let http = httpFor(a, calls);
    if (a["simulate-approval"] === true) http = simulatedReviewer(http, dir, statuses);
    const r = await verifyApproval({ dir, http, token: keyFor(ws, "notion", live), statuses });
    console.log(r.ok ? `approved: ${r.draft.key}` : `not approved: ${r.reason}`);
  } else throw new Error("first argument must be build, stage or check");
});
