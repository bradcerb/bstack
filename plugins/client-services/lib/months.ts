// Month arithmetic on "YYYY-MM" strings. Pure, no clock.
export const isMonth = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
export function addMonths(ym: string, n: number) {
  const y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7)) - 1 + n;
  const yy = y + Math.floor(m / 12), mm = ((m % 12) + 12) % 12;
  return `${yy}-${String(mm + 1).padStart(2, "0")}`;
}
export const daysInMonth = (ym: string) => new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0)).getUTCDate();
// UTC bounds of a month, in unix seconds: [start, end).
export function monthBounds(ym: string) {
  const start = Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1) / 1000;
  const end = Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 1) / 1000;
  return { start, end };
}
// Whole days from one ISO date to another (date part only, UTC).
export function daysBetween(fromIso: string, toIso: string) {
  const a = Date.UTC(+fromIso.slice(0, 4), +fromIso.slice(5, 7) - 1, +fromIso.slice(8, 10));
  const b = Date.UTC(+toIso.slice(0, 4), +toIso.slice(5, 7) - 1, +toIso.slice(8, 10));
  return Math.round((b - a) / 86400000);
}
