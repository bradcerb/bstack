// workspace.json reader (bstack config v2). The file is the only config: scripts take --config, or walk
// upward from the working directory to find it. Secrets are env var names under "secrets", never values.
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";

export interface Workspace {
  file: string;
  root: string;
  doc: Record<string, any>;
}

export function findWorkspace(explicit?: string): string {
  if (explicit) {
    if (!existsSync(explicit)) throw new Error(`workspace.json not found at ${explicit}`);
    return resolve(explicit);
  }
  for (let d = process.cwd(); ; d = dirname(d)) {
    const f = join(d, "workspace.json");
    if (existsSync(f)) return f;
    if (dirname(d) === d) throw new Error("workspace.json not found: pass --config or run from inside the workspace");
  }
}

export function loadWorkspace(explicit?: string): Workspace {
  const file = findWorkspace(explicit);
  const doc = JSON.parse(readFileSync(file, "utf8"));
  if (doc.bstack_config_version !== 2) throw new Error(`${file}: bstack_config_version must be 2`);
  const root = resolve(dirname(file), doc.workspace?.root ?? ".");
  return { file, root, doc };
}

// Absent, empty, "via": "none", or REPLACE_WITH anywhere inside counts as unset.
export function isUnset(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return true;
  if (typeof v === "string") return v.startsWith("REPLACE_WITH");
  if (Array.isArray(v)) return v.length === 0 || v.some(isUnset);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (o.via === "none") return true;
    return Object.values(o).some((x) => typeof x === "string" && x.startsWith("REPLACE_WITH"));
  }
  return false;
}

export function setting<T = unknown>(ws: Workspace, path: string, opts: { optional: true }): T | undefined;
export function setting<T = unknown>(ws: Workspace, path: string, opts?: { optional?: false }): T;
export function setting<T>(ws: Workspace, path: string, opts: { optional?: boolean } = {}): T | undefined {
  const v = path.split(".").reduce<any>((o, k) => (o == null ? undefined : o[k]), ws.doc);
  if (isUnset(v)) {
    if (opts.optional) return undefined;
    throw new Error(`workspace.json: setting ${path} is not set (${ws.file})`);
  }
  return v as T;
}

export interface Binding { via: string; path?: string; connector?: string; target?: string; url?: string }
export function source(ws: Workspace, kind: string, opts: { optional?: boolean } = {}): Binding | undefined {
  const v = ws.doc.sources?.[kind];
  if (isUnset(v)) {
    if (opts.optional) return undefined;
    throw new Error(`workspace.json: source ${kind} is not bound (${ws.file})`);
  }
  return v as Binding;
}

export const resolvePath = (ws: Workspace, p: string) => (isAbsolute(p) ? p : resolve(ws.root, p));

// File binding -> absolute path. Other bindings are refused: these scripts read files.
export function sourceFile(ws: Workspace, kind: string): string {
  const b = source(ws, kind) as Binding;
  if (b.via !== "file" || !b.path) throw new Error(`workspace.json: source ${kind} must be a file binding for this script`);
  return resolvePath(ws, b.path);
}

// secrets.<name>.env names the variable; the value comes from the environment. Returns undefined when either is missing.
export function secretValue(ws: Workspace, name: string, env: NodeJS.ProcessEnv = process.env): { env: string | null; value: string | undefined } {
  const envName = ws.doc.secrets?.[name]?.env;
  if (typeof envName !== "string" || isUnset(envName)) return { env: null, value: undefined };
  return { env: envName, value: env[envName] || undefined };
}
