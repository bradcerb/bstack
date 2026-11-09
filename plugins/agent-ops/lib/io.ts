import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const sha256 = (b: Buffer | string) => createHash("sha256").update(b).digest("hex");
export const readJson = <T = any>(path: string): T => JSON.parse(readFileSync(path, "utf8"));
export const readJsonIfExists = <T = any>(path: string): T | null => (existsSync(path) ? readJson<T>(path) : null);
export function writeFile(path: string, data: Buffer | string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
}
// Stable JSON: 2-space indent, trailing newline. Key order is the order the code builds.
export const toJson = (v: unknown) => JSON.stringify(v, null, 2) + "\n";
export const writeJson = (path: string, v: unknown) => writeFile(path, toJson(v));

// Tiny argument parser: --key value, --flag (boolean). Positional args are not used.
export function parseArgs(argv = process.argv.slice(2)) {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) throw new Error(`unexpected argument: ${a}`);
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else { out[key] = next; i++; }
  }
  return out;
}
export function req(args: Record<string, string | boolean>, key: string): string {
  const v = args[key];
  if (typeof v !== "string" || !v) throw new Error(`missing required option --${key}`);
  return v;
}
export const opt = (args: Record<string, string | boolean>, key: string, dflt: string) => (typeof args[key] === "string" ? (args[key] as string) : dflt);

// Run a CLI main() and turn thrown errors into a clean message + exit code 1.
export function runCli(main: () => Promise<void> | void) {
  Promise.resolve()
    .then(main)
    .catch((e) => {
      console.error(`error: ${e?.message ?? e}`);
      process.exit(1);
    });
}
