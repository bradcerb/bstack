// Reviewer copy: every number, every unavailable source, every note. Staged next to the email; never sent.
import type { HostingReportModel } from "../../lib/model";

export function reviewNote(m: HostingReportModel): string {
  const L = [
    `Hosting report review: ${m.domain}, ${m.monthYear}`, "",
    `Subject: ${m.subject}`,
    `Headline: ${m.headline}`,
    `Asks to client: ${m.attention.length ? m.attention.map((a) => a.title).join("; ") : "none"}`,
    `Charts: ${m.highlights.map((h) => h.key).join(", ") || "none"}`,
    `Checklist: ${m.checklist.map((c) => `${c.label} ${c.mark}`).join(", ") || "none"}`,
    "", "Numbers:", ...m.review.details.map((d) => `- ${d.label}: ${d.value}`),
    "", "Sources not available:", ...(m.review.unavailableSources.length ? m.review.unavailableSources.map((s) => `- ${s.source}: ${s.status}${s.reason ? ` (${s.reason})` : ""}`) : ["- none"]),
    "", "Notes:", ...(m.review.notes.length ? m.review.notes.map((n) => `- ${n}`) : ["- none"]),
  ];
  return L.join("\n") + "\n";
}
