// Branded primitives for drafts. Only the parse functions produce them.
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type Sha256 = Brand<string, "Sha256">;
export type IdempotencyKey = Brand<string, "IdempotencyKey">;

export function parseSha256(s: unknown): Sha256 {
  if (typeof s !== "string" || !/^[0-9a-f]{64}$/.test(s)) throw new Error(`not a sha256 hex digest: ${JSON.stringify(s)}`);
  return s as Sha256;
}
// Stable per message, for example "hosting-report/<site>/<YYYY-MM>". Resend keeps it for 24 hours; the ledger keeps it forever.
export function parseIdempotencyKey(s: unknown): IdempotencyKey {
  if (typeof s !== "string" || !/^[a-z0-9][a-z0-9/._-]{2,255}$/i.test(s)) throw new Error(`not an idempotency key: ${JSON.stringify(s)}`);
  return s as IdempotencyKey;
}
