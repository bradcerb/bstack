// Minimal JSON Schema checker for the subset our schema files use: type, required, properties,
// additionalProperties:false, items, maxItems, enum, const, minimum, maximum, pattern, $ref to #/$defs.
// Every file read at a boundary goes through parseWith, so a bad handoff fails loudly before rendering.
import { readFileSync } from "node:fs";

type Schema = any;
const typeOf = (v: unknown) => (v === null ? "null" : Array.isArray(v) ? "array" : Number.isInteger(v) ? "integer" : typeof v);

function check(v: unknown, s: Schema, path: string, errs: string[], root: Schema) {
  if (s.$ref) s = root.$defs?.[String(s.$ref).replace("#/$defs/", "")] ?? s;
  if (s.type) {
    const types: string[] = Array.isArray(s.type) ? s.type : [s.type];
    const t = typeOf(v);
    if (!types.includes(t) && !(t === "integer" && types.includes("number"))) {
      errs.push(`${path}: expected ${types.join("|")}, got ${t}`);
      return;
    }
  }
  if (s.const !== undefined && v !== s.const) errs.push(`${path}: must be ${JSON.stringify(s.const)}`);
  if (s.enum && !s.enum.includes(v)) errs.push(`${path}: must be one of ${JSON.stringify(s.enum)}`);
  if (typeof v === "number") {
    if (s.minimum !== undefined && v < s.minimum) errs.push(`${path}: below minimum ${s.minimum}`);
    if (s.maximum !== undefined && v > s.maximum) errs.push(`${path}: above maximum ${s.maximum}`);
  }
  if (typeof v === "string" && s.pattern && !new RegExp(s.pattern).test(v)) errs.push(`${path}: does not match ${s.pattern}`);
  if (Array.isArray(v)) {
    if (s.maxItems !== undefined && v.length > s.maxItems) errs.push(`${path}: more than ${s.maxItems} items`);
    if (s.items) v.forEach((x, i) => check(x, s.items, `${path}[${i}]`, errs, root));
  }
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    for (const r of s.required ?? []) if (!(r in o)) errs.push(`${path}.${r}: required`);
    for (const [k, ps] of Object.entries(s.properties ?? {})) if (k in o) check(o[k], ps, `${path}.${k}`, errs, root);
    if (s.additionalProperties === false) for (const k of Object.keys(o)) if (!(k in (s.properties ?? {}))) errs.push(`${path}.${k}: not allowed`);
  }
}

export function validate(value: unknown, schema: Schema): string[] {
  const errs: string[] = [];
  check(value, schema, "$", errs, schema);
  return errs;
}

export const loadSchema = (path: string): Schema => JSON.parse(readFileSync(path, "utf8"));

// Returns the value typed as T only when it matches the schema. Throws with the first 20 problems otherwise.
export function parseWith<T>(value: unknown, schema: Schema, what: string): T {
  const errs = validate(value, schema);
  if (errs.length) throw new Error(`${what} does not match ${schema.$id ?? "schema"}:\n  ${errs.slice(0, 20).join("\n  ")}`);
  return value as T;
}
