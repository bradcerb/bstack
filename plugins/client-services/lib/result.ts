// What every collector returns. Data exists only on the ok branch, so code that turns a result into
// copy has to check kind first; a missing number cannot reach a sentence.
export type SourceResult<T> =
  | { kind: "ok"; data: T }
  | { kind: "unavailable"; reason: string }
  | { kind: "error"; reason: string };

export const ok = <T>(data: T): SourceResult<T> => ({ kind: "ok", data });
export const unavailable = <T = never>(reason: string): SourceResult<T> => ({ kind: "unavailable", reason });
export const failed = <T = never>(reason: string): SourceResult<T> => ({ kind: "error", reason });

// Snapshot form: a status entry plus a nullable section.
export interface SourceStatus { status: "ok" | "unavailable" | "error"; reason?: string }
export const statusOf = (r: SourceResult<unknown>): SourceStatus => (r.kind === "ok" ? { status: "ok" } : { status: r.kind, reason: r.reason });
export const dataOf = <T>(r: SourceResult<T>): T | null => (r.kind === "ok" ? r.data : null);
