// Stripe (restricted, read-only key): subscription status and this month's invoice state.
import { isPlaceholder } from "../../../lib/config";
import { monthBounds } from "../../../lib/months";
import type { Billing } from "../../../lib/snapshot";
import { type Ctx, isoDate, ok, type SourceResult, unavailable } from "./types";

export function invoiceState(inv: any, sub: any, asOfUnix: number): "paid" | "processing" | "failed" | "none" {
  if (!inv) return "none";
  if (inv.status === "paid") return "paid";
  if (inv.status === "uncollectible") return "failed";
  if (inv.status === "void" || inv.status === "draft") return "none";
  // open: Stripe marks the subscription past_due/unpaid when a charge fails. That, or a passed due date,
  // counts as failed. Anything else is still processing (for example an ACH payment that takes days).
  if (["past_due", "unpaid"].includes(sub?.status)) return "failed";
  if (inv.due_date && inv.due_date < asOfUnix) return "failed";
  return "processing";
}

export async function collectStripe(ctx: Ctx): Promise<SourceResult<Billing>> {
  const subId = ctx.site.stripe?.subscriptionId, key = ctx.keys.stripe;
  if (!subId || isPlaceholder(subId)) return unavailable("not configured for this site");
  if (!key) return unavailable(ctx.keyMissing("stripe"));
  const h = { headers: { Authorization: `Bearer ${key}` } };
  const s = await ctx.http(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subId)}`, h);
  if (s.status !== 200) throw new Error(`Stripe HTTP ${s.status} on subscription`);
  const { start, end } = monthBounds(ctx.month);
  const q = new URLSearchParams({ subscription: subId, "created[gte]": String(start), "created[lt]": String(end), limit: "10" });
  const i = await ctx.http(`https://api.stripe.com/v1/invoices?${q.toString()}`, h);
  if (i.status !== 200) throw new Error(`Stripe HTTP ${i.status} on invoices`);
  const inv = [...(i.json?.data ?? [])].sort((a: any, b: any) => b.created - a.created)[0] ?? null;
  const asOfUnix = Date.UTC(+ctx.asOf.slice(0, 4), +ctx.asOf.slice(5, 7) - 1, +ctx.asOf.slice(8, 10)) / 1000;
  const state = invoiceState(inv, s.json, asOfUnix);
  const paidAt = inv?.status_transitions?.paid_at ?? null;
  return ok({
    state, invoiceDate: inv ? isoDate(paidAt ?? inv.created) : null,
    amount: inv ? (inv.amount_due ?? inv.total) / 100 : null, currency: inv?.currency ?? null, subscriptionStatus: s.json?.status ?? null,
  });
}
