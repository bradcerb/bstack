// approval-stage + email-send: the only path to a send is an ApprovedDraft issued against a matching hash.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mockHttp, type Http, type RecordedCall } from "../lib/http";
import { sha256 } from "../lib/io";
import { ApprovedDraft, DEFAULT_STATUSES, buildDraft, simulatedReviewer, stage, verifyApproval } from "../skills/approval-stage/approval";
import { readLedger, send } from "../skills/email-send/send";

const ROUTES = join(__dirname, "../examples/mocks/routes.json");
const S = DEFAULT_STATUSES;
const KEY = "example-report/site-a/2026-10";
const ENVELOPE = { from: "Sender <reports@example.com>", to: ["a@example.com", "b@example.com"], replyTo: "sender@example.com" };

function rendered(): string {
  const dir = mkdtempSync(join(tmpdir(), "ao-test-"));
  const files: Record<string, string | Buffer> = { "email.html": '<html><img src="cid:logo"></html>', "email.txt": "Hello\n", "logo.png": Buffer.from([137, 80, 78, 71]), "note.md": "Numbers: none\n" };
  for (const [f, v] of Object.entries(files)) writeFileSync(join(dir, f), v);
  const ref = (f: string) => ({ path: f, sha256: sha256(readFileSync(join(dir, f))) });
  writeFileSync(join(dir, "rendered.json"), JSON.stringify({ schema: "rendered-email", version: 1, template: "t", subject: "Subject", preview: null, html: ref("email.html"), text: ref("email.txt"), previewHtml: ref("email.html"), images: [{ cid: "logo", ...ref("logo.png") }] }));
  return dir;
}
async function staged(dir = rendered()) {
  buildDraft({ dir, key: KEY, envelope: ENVELOPE, notePath: join(dir, "note.md") });
  await stage({ dir, http: mockHttp(ROUTES), token: "t", databaseId: "db", statuses: S, title: "T", live: false });
  return dir;
}
const approve = (dir: string, calls: RecordedCall[] = []) => simulatedReviewer(mockHttp(ROUTES, calls), dir, S);
const noNetwork: Http = async () => { throw new Error("network must not be called"); };

test("approved and unchanged: sends once with the idempotency key, then the ledger refuses a second send", async () => {
  const dir = await staged();
  const calls: RecordedCall[] = [];
  const http = approve(dir, calls);
  const ledgerPath = join(dir, "ledger.jsonl");
  const check = await verifyApproval({ dir, http, token: "secret-notion-token", statuses: S });
  assert.ok(check.ok);
  const r1 = await send(check.draft, { http, apiKey: "secret-resend-key", ledgerPath, live: false, now: () => "2026-11-01T00:00:00Z" });
  assert.equal(r1.status, "sent");
  const req = calls.find((c) => c.url.includes("resend"))!;
  assert.equal(req.headers["Idempotency-Key"], KEY);
  assert.equal(req.headers.Authorization, "[redacted]");
  assert.deepEqual(req.body.attachments.map((a: any) => a.content_id), ["logo"]);
  assert.ok(!JSON.stringify(calls).includes("secret-"), "a key value reached the request log");
  const again = await verifyApproval({ dir, http, token: "t", statuses: S });
  assert.ok(again.ok);
  const r2 = await send(again.draft, { http, apiKey: "k", ledgerPath, live: false });
  assert.equal(r2.status, "skipped");
  assert.equal(readLedger(ledgerPath).length, 1);
});

test("not approved on the review page: no ApprovedDraft", async () => {
  const dir = await staged();
  const r = await verifyApproval({ dir, http: mockHttp(ROUTES), token: "t", statuses: S });
  assert.deepEqual(r, { ok: false, reason: "not approved (status: Needs review)" });
});

test("email edited after rendering, or draft.json edited by hand: refused", async () => {
  const a = await staged();
  writeFileSync(join(a, "email.html"), "<html>changed</html>");
  const r1 = await verifyApproval({ dir: a, http: approve(a), token: "t", statuses: S });
  assert.ok(!r1.ok && /changed since it was rendered/.test(r1.reason));
  const b = await staged();
  const d = JSON.parse(readFileSync(join(b, "draft.json"), "utf8"));
  d.envelope.to.push("extra@example.com");
  writeFileSync(join(b, "draft.json"), JSON.stringify(d));
  const r2 = await verifyApproval({ dir: b, http: approve(b), token: "t", statuses: S });
  assert.ok(!r2.ok && /edited after it was built/.test(r2.reason));
});

test("recipients changed and rebuilt after staging: refused until staged again", async () => {
  const dir = await staged();
  buildDraft({ dir, key: KEY, envelope: { ...ENVELOPE, to: ["someone-else@example.com"] } });
  const r = await verifyApproval({ dir, http: approve(dir), token: "t", statuses: S });
  assert.deepEqual(r, { ok: false, reason: "draft changed after it was staged; stage it again" });
});

test("review page approved for a different hash: refused", async () => {
  const dir = await staged();
  const http: Http = async (url, req) => (req?.method ?? "GET") === "GET"
    ? { status: 200, text: "", json: { properties: { Status: { select: { name: "Approved" } }, "Draft hash": { rich_text: [{ plain_text: "0".repeat(64) }] } } } }
    : mockHttp(ROUTES)(url, req);
  const r = await verifyApproval({ dir, http, token: "t", statuses: S });
  assert.ok(!r.ok && /hash does not match/.test(r.reason));
});

test("a forged ApprovedDraft cannot be sent, and cannot be issued from outside approval-stage", async () => {
  const forged = { key: KEY, envelope: ENVELOPE, subject: "s", html: "", text: "", images: [], draftHash: "0".repeat(64), pageId: "p" } as unknown as ApprovedDraft;
  await assert.rejects(send(forged, { http: noNetwork, apiKey: "k", ledgerPath: join(tmpdir(), "nope.jsonl"), live: false }), /not an ApprovedDraft/);
  assert.throws(() => (ApprovedDraft as any).issue({}, "p", Symbol("fake")), /only be issued by approval-stage/);
});

test("same key, different content in the ledger: blocked; live with placeholder recipients: blocked before any request", async () => {
  const dir = await staged();
  const ok = await verifyApproval({ dir, http: approve(dir), token: "t", statuses: S });
  assert.ok(ok.ok);
  const ledgerPath = join(dir, "ledger.jsonl");
  writeFileSync(ledgerPath, JSON.stringify({ key: KEY, draftHash: "f".repeat(64), emailId: "x", to: [], sentAt: "", mode: "live" }) + "\n");
  assert.equal((await send(ok.draft, { http: noNetwork, apiKey: "k", ledgerPath, live: true })).status, "blocked");
  const p = rendered();
  buildDraft({ dir: p, key: KEY, envelope: { ...ENVELOPE, to: ["PLACEHOLDER-a@example.invalid"] } });
  await stage({ dir: p, http: mockHttp(ROUTES), token: "t", databaseId: "db", statuses: S, title: "T", live: false });
  const c = await verifyApproval({ dir: p, http: approve(p), token: "t", statuses: S });
  assert.ok(c.ok);
  const r = await send(c.draft, { http: noNetwork, apiKey: "k", ledgerPath: join(p, "l.jsonl"), live: true });
  assert.equal(r.status, "blocked");
});

test("staging the same draft twice creates one page", async () => {
  const dir = await staged();
  const calls: RecordedCall[] = [];
  const r = await stage({ dir, http: mockHttp(ROUTES, calls), token: "t", databaseId: "db", statuses: S, title: "T", live: false });
  assert.equal(r.skipped, "already staged");
  assert.equal(calls.length, 0);
});
