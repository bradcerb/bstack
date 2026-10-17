// Notion requests for one review page per draft. The approvals database needs these properties:
// Name (title), Status (select), Key (text), Subject (text), Draft hash (text).
import type { Http } from "../../lib/http";

const API = "https://api.notion.com/v1";
const VERSION = "2022-06-28";
const headers = (token: string) => ({ Authorization: `Bearer ${token}`, "Notion-Version": VERSION, "Content-Type": "application/json" });
const rt = (s: string) => [{ type: "text", text: { content: s.slice(0, 2000) } }];
const chunks = (s: string, n = 1900) => {
  const out: string[] = [];
  for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
  return out;
};

export function pageBody(o: { databaseId: string; status: string; key: string; subject: string; title: string; draftHash: string; note: string | null; text: string }) {
  const para = (s: string) => ({ object: "block", type: "paragraph", paragraph: { rich_text: rt(s) } });
  const h = (s: string) => ({ object: "block", type: "heading_2", heading_2: { rich_text: rt(s) } });
  const code = (s: string) => ({ object: "block", type: "code", code: { language: "plain text", rich_text: chunks(s).slice(0, 100).map((c) => ({ type: "text", text: { content: c } })) } });
  return {
    parent: { database_id: o.databaseId },
    properties: {
      Name: { title: rt(o.title) },
      Status: { select: { name: o.status } },
      Key: { rich_text: rt(o.key) },
      Subject: { rich_text: rt(o.subject) },
      "Draft hash": { rich_text: rt(o.draftHash) },
    },
    children: [
      para("Set Status to Approved to allow sending. Any change to the draft or its recipients after staging blocks the send until it is staged again."),
      ...(o.note ? [h("Review note"), code(o.note)] : []),
      h("Email text"),
      code(o.text),
    ],
  };
}

export async function createPage(http: Http, token: string, body: unknown): Promise<string> {
  const r = await http(`${API}/pages`, { method: "POST", headers: headers(token), body: JSON.stringify(body) });
  if (r.status !== 200 || typeof r.json?.id !== "string") throw new Error(`Notion create page failed (HTTP ${r.status})`);
  return r.json.id;
}

export async function readReview(http: Http, token: string, pageId: string): Promise<{ status: string | null; draftHash: string }> {
  const r = await http(`${API}/pages/${encodeURIComponent(pageId)}`, { headers: headers(token) });
  if (r.status !== 200 || !r.json?.properties) throw new Error(`Notion read page failed (HTTP ${r.status})`);
  const p = r.json.properties;
  return {
    status: typeof p.Status?.select?.name === "string" ? p.Status.select.name : null,
    draftHash: (p["Draft hash"]?.rich_text ?? []).map((x: any) => x.plain_text ?? x.text?.content ?? "").join(""),
  };
}

export async function setStatus(http: Http, token: string, pageId: string, status: string): Promise<void> {
  const r = await http(`${API}/pages/${encodeURIComponent(pageId)}`, { method: "PATCH", headers: headers(token), body: JSON.stringify({ properties: { Status: { select: { name: status } } } }) });
  if (r.status !== 200) throw new Error(`Notion status update failed (HTTP ${r.status})`);
}
