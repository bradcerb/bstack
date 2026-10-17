// One small HTTP interface for every API call, so tests can swap in recorded responses.
// Secrets live only in request headers/bodies and are never logged: recorded requests redact them.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface HttpRequest { method?: string; headers?: Record<string, string>; body?: string; timeoutMs?: number }
export interface HttpResponse { status: number; json: any; text: string }
export type Http = (url: string, req?: HttpRequest) => Promise<HttpResponse>;
export interface RecordedCall { method: string; url: string; headers: Record<string, string>; body?: any }

const SECRET_HEADERS = /^(authorization|idempotency-key-secret|notion-version-secret|x-api-key)$/i;
export function redact(headers: Record<string, string> = {}) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) out[k] = SECRET_HEADERS.test(k) ? "[redacted]" : v;
  return out;
}
// Strip secret-looking query params (key=, api_key=) from URLs before they are logged or saved.
export const redactUrl = (url: string) => url.replace(/([?&](?:key|api_key|token)=)[^&]*/gi, "$1[redacted]");
const redactBody = (body: any) => {
  if (typeof body === "string") return body.replace(/(^|&)((?:api_key|key|token)=)[^&]*/gi, "$1$2[redacted]"); // form bodies
  if (!body || typeof body !== "object") return body;
  const c = { ...body };
  for (const k of Object.keys(c)) if (/^(api_key|key|token)$/i.test(k)) c[k] = "[redacted]";
  return c;
};

export const realHttp: Http = async (url, req = {}) => {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), req.timeoutMs ?? 60000);
  try {
    const res = await fetch(url, { method: req.method ?? "GET", headers: req.headers, body: req.body, signal: ctl.signal });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
    return { status: res.status, json, text };
  } finally {
    clearTimeout(timer);
  }
};

// Recorded-response HTTP for tests and dry runs. routes.json: [{ "method": "GET", "match": "substring of URL", "file": "x.json", "status": 200 }]
// First matching route wins. Unmatched calls get a 599 so callers fail soft, exactly like a network error.
export function mockHttp(routesFile: string | null, calls: RecordedCall[] = []): Http {
  const routes: { method?: string; match: string; file?: string; status?: number }[] = routesFile ? JSON.parse(readFileSync(routesFile, "utf8")) : [];
  const dir = routesFile ? dirname(routesFile) : "";
  return async (url, req = {}) => {
    const method = req.method ?? "GET";
    let body: any = req.body;
    try { body = req.body ? JSON.parse(req.body) : undefined; } catch { /* form body */ }
    calls.push({ method, url: redactUrl(url), headers: redact(req.headers), body: redactBody(body) });
    const r = routes.find((x) => url.includes(x.match) && (!x.method || x.method === method));
    if (!r) return { status: 599, json: null, text: "no recorded response" };
    const text = r.file ? readFileSync(join(dir, r.file), "utf8") : "";
    return { status: r.status ?? 200, json: text ? JSON.parse(text) : null, text };
  };
}
