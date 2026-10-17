// hosting-report-model v1: what hosting-snapshot-diff writes and the email template reads.
// The schema file is a copy of the one in the email render kit; the runner refuses to run when they differ.
import { join } from "node:path";
import type { Month, SiteId } from "./ids";
import { loadSchema, parseWith } from "./schema";

export const MODEL_SCHEMA_FILE = join(__dirname, "..", "schemas", "hosting-report-model.v1.schema.json");
export const MODEL_SCHEMA = "hosting-report-model";
export const MODEL_VERSION = 1;

export interface ChartSpec {
  file: string;
  type: "bars";
  labels: string[];
  values: number[];
  valueFormat: "pct" | "pctInt" | "int" | "sec";
  min: number;
  max: number;
  target: { value: number; label: string } | null;
  scaleNote: string | null;
  delta: string | null;
}

export interface HostingReportModel {
  schema: "hosting-report-model";
  version: 1;
  siteId: SiteId;
  domain: string;
  month: Month;
  monthLabel: string;
  monthYear: string;
  prevLabel: string | null;
  subject: string;
  preview: string;
  headerMeta: string;
  kicker: string;
  headline: string;
  headlineSentence: string;
  greeting: string;
  opener: string;
  careLog: string;
  attentionHeading: string;
  attention: { key: string; title: string; body: string }[];
  attentionNone: string | null;
  highlights: { key: string; title: string; chart: string; caption: string; alt: string }[];
  charts: ChartSpec[];
  checklistTitle: string;
  checklist: { key: string; label: string; line: string; mark: "ok" | "watch" }[];
  close: { question: string; projectLine: string; projectLinkText: string; projectUrl: string; thanks: string; signature: string };
  footer: { reason: string; replyNote: string; preferencesText: string };
  plainText: { titleLine: string; attentionHeading: string };
  review: { details: { label: string; value: string }[]; unavailableSources: { source: string; status: "unavailable" | "error"; reason: string }[]; notes: string[] };
  inputs: { month: string; sha256: string }[];
}

export function parseModel(value: unknown, what = "hosting report model"): HostingReportModel {
  const m = parseWith<HostingReportModel>(value, loadSchema(MODEL_SCHEMA_FILE), what);
  const files = new Set(m.charts.map((c) => c.file));
  for (const h of m.highlights) if (!files.has(h.chart)) throw new Error(`${what}: highlight ${h.key} points at chart ${h.chart}, which is not in charts`);
  return m;
}
