// approval-stage core. Turns a rendered email into an email-draft, stages it on a review page, and is the
// only code that can produce an ApprovedDraft: a draft whose files still hash to the staged draftHash and
// whose review page says Approved with that same hash, read at the moment of the check.
import { existsSync, readFileSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import type { Http } from "../../lib/http";
import { parseIdempotencyKey, parseSha256, type IdempotencyKey, type Sha256 } from "../../lib/ids";
import { readJsonIfExists, sha256, toJson, writeJson } from "../../lib/io";
import { loadSchema, parseWith } from "../../lib/schema";
import { createPage, pageBody, readReview, setStatus } from "./notion";

const SCHEMAS = join(__dirname, "..", "..", "schemas");
export const DRAFT_FILE = "draft.json";
export const STAGED_FILE = "staged.json";

export interface Statuses { review: string; approved: string; sent: string }
export const DEFAULT_STATUSES: Statuses = { review: "Needs review", approved: "Approved", sent: "Sent" };
export interface Envelope { from: string; to: string[]; replyTo: string | null }
interface FileRef { path: string; sha256: string }
export interface EmailDraft {
  schema: "email-draft";
  version: 1;
  key: IdempotencyKey;
  envelope: Envelope;
  subject: string;
  content: { html: FileRef; text: FileRef; images: { cid: string; path: string; sha256: string }[] };
  note: FileRef | null;
  draftHash: Sha256;
}
export interface StagedRecord { schema: "approval-staged"; version: 1; key: string; draftHash: string; pageId: string; mode: "live" | "dry-run" }

const hashOf = (d: Omit<EmailDraft, "draftHash">) => sha256(toJson(d)) as Sha256;

function readChecked(dir: string, ref: FileRef, what: string): Buffer {
  const p = resolve(dir, ref.path);
  if (relative(dir, p).startsWith("..")) throw new Error(`${what} path leaves the draft folder: ${ref.path}`);
  const b = readFileSync(p);
  if (sha256(b) !== ref.sha256) throw new Error(`${what} (${ref.path}) changed since it was rendered`);
  return b;
}

// Build draft.json in the rendered folder. Reads rendered.json through the consumer schema and checks every file.
export function buildDraft(o: { dir: string; key: string; envelope: Envelope; notePath?: string }): EmailDraft {
  const r = parseWith<{ subject: string; html: FileRef; text: FileRef; images: { cid: string; path: string; sha256: string }[] }>(
    JSON.parse(readFileSync(join(o.dir, "rendered.json"), "utf8")), loadSchema(join(SCHEMAS, "rendered-email.consumer.v1.schema.json")), join(o.dir, "rendered.json"));
  readChecked(o.dir, r.html, "html");
  readChecked(o.dir, r.text, "text");
  for (const im of r.images) readChecked(o.dir, im, `image ${im.cid}`);
  if (!o.envelope.to.length) throw new Error("draft has no recipients");
  let note: FileRef | null = null;
  if (o.notePath) {
    const rel = relative(o.dir, resolve(o.notePath));
    if (rel.startsWith("..")) throw new Error("review note must be inside the draft folder");
    note = { path: rel, sha256: sha256(readFileSync(o.notePath)) };
  }
  const body: Omit<EmailDraft, "draftHash"> = {
    schema: "email-draft", version: 1, key: parseIdempotencyKey(o.key), envelope: o.envelope, subject: r.subject,
    content: { html: { path: r.html.path, sha256: r.html.sha256 }, text: { path: r.text.path, sha256: r.text.sha256 }, images: r.images.map((i) => ({ cid: i.cid, path: i.path, sha256: i.sha256 })) },
    note,
  };
  const draft: EmailDraft = { ...body, draftHash: hashOf(body) };
  writeJson(join(o.dir, DRAFT_FILE), draft);
  return draft;
}

// Read draft.json, check the schema, the draftHash, and every file it names. Returns the bytes that were checked.
export function loadDraft(dir: string) {
  const draft = parseWith<EmailDraft>(JSON.parse(readFileSync(join(dir, DRAFT_FILE), "utf8")), loadSchema(join(SCHEMAS, "email-draft.v1.schema.json")), join(dir, DRAFT_FILE));
  const { draftHash, ...body } = draft;
  if (hashOf(body) !== parseSha256(draftHash)) throw new Error(`${join(dir, DRAFT_FILE)} was edited after it was built (draftHash does not match)`);
  return {
    draft,
    html: readChecked(dir, draft.content.html, "html").toString("utf8"),
    text: readChecked(dir, draft.content.text, "text").toString("utf8"),
    images: draft.content.images.map((im) => ({ cid: im.cid, filename: basename(im.path), content: readChecked(dir, im, `image ${im.cid}`) })),
    note: draft.note ? readChecked(dir, draft.note, "review note").toString("utf8") : null,
  };
}

// Create one review page per draftHash. Re-running with the same draft is a no-op.
export async function stage(o: { dir: string; http: Http; token: string; databaseId: string; statuses: Statuses; title: string; live: boolean }): Promise<StagedRecord & { skipped?: string }> {
  const { draft, text, note } = loadDraft(o.dir);
  const mode = o.live ? "live" : "dry-run";
  const prior = readJsonIfExists<StagedRecord>(join(o.dir, STAGED_FILE));
  if (prior && prior.draftHash === draft.draftHash && prior.mode === mode) return { ...prior, skipped: "already staged" };
  const pageId = await createPage(o.http, o.token, pageBody({ databaseId: o.databaseId, status: o.statuses.review, key: draft.key, subject: draft.subject, title: o.title, draftHash: draft.draftHash, note, text }));
  const rec: StagedRecord = { schema: "approval-staged", version: 1, key: draft.key, draftHash: draft.draftHash, pageId, mode };
  writeJson(join(o.dir, STAGED_FILE), rec);
  return rec;
}

// ---------- ApprovedDraft: the only way into email-send ----------
const issued = new WeakSet<object>();

export class ApprovedDraft {
  private constructor(
    readonly key: IdempotencyKey,
    readonly envelope: Readonly<Envelope>,
    readonly subject: string,
    readonly html: string,
    readonly text: string,
    readonly images: readonly { cid: string; filename: string; content: Buffer }[],
    readonly draftHash: Sha256,
    readonly pageId: string,
  ) {
    Object.freeze(this);
  }
  /** @internal Called only by verifyApproval in this module. */
  static issue(x: ReturnType<typeof loadDraft>, pageId: string, token: typeof ISSUE): ApprovedDraft {
    if (token !== ISSUE) throw new Error("ApprovedDraft can only be issued by approval-stage");
    const d = new ApprovedDraft(x.draft.key, Object.freeze({ ...x.draft.envelope, to: [...x.draft.envelope.to] }), x.draft.subject, x.html, x.text, Object.freeze([...x.images]), x.draft.draftHash, pageId);
    issued.add(d);
    return d;
  }
}
const ISSUE = Symbol("approval-stage issue token");

// Throws unless d came out of verifyApproval in this process. A cast or a hand-built object fails here.
export function assertApproved(d: ApprovedDraft): void {
  if (!issued.has(d)) throw new Error("not an ApprovedDraft issued by approval-stage; refusing");
}

export type ApprovalCheck = { ok: true; draft: ApprovedDraft } | { ok: false; reason: string };

export async function verifyApproval(o: { dir: string; http: Http; token: string; statuses: Statuses }): Promise<ApprovalCheck> {
  const staged = readJsonIfExists<StagedRecord>(join(o.dir, STAGED_FILE));
  if (!staged?.pageId) return { ok: false, reason: "not staged yet" };
  let loaded: ReturnType<typeof loadDraft>;
  try {
    loaded = loadDraft(o.dir);
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
  if (staged.draftHash !== loaded.draft.draftHash) return { ok: false, reason: "draft changed after it was staged; stage it again" };
  const review = await readReview(o.http, o.token, staged.pageId);
  if (review.status !== o.statuses.approved) return { ok: false, reason: `not approved (status: ${review.status ?? "none"})` };
  if (review.draftHash !== loaded.draft.draftHash) return { ok: false, reason: "review page hash does not match this draft; stage it again" };
  return { ok: true, draft: ApprovedDraft.issue(loaded, staged.pageId, ISSUE) };
}

export async function markSent(d: ApprovedDraft, o: { http: Http; token: string; statuses: Statuses }): Promise<void> {
  assertApproved(d);
  await setStatus(o.http, o.token, d.pageId, o.statuses.sent);
}

// Dry runs only: answer the review-page read as if the reviewer approved the staged draft unchanged.
export function simulatedReviewer(base: Http, dir: string, statuses: Statuses): Http {
  return async (url, req = {}) => {
    const staged = readJsonIfExists<StagedRecord>(join(dir, STAGED_FILE));
    if ((req.method ?? "GET") === "GET" && staged && url.startsWith(`https://api.notion.com/v1/pages/${staged.pageId}`)) {
      await base(url, req); // still recorded by a mock
      return { status: 200, text: "", json: { properties: { Status: { select: { name: statuses.approved } }, "Draft hash": { rich_text: [{ plain_text: staged.draftHash }] } } } };
    }
    return base(url, req);
  };
}

export const draftExists = (dir: string) => existsSync(join(dir, DRAFT_FILE));
