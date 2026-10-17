// Locale-free formatters. No Intl and no clock, so output never depends on the machine.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const monthShort = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1];
export const monthLong = (ym: string) => MONTHS_LONG[Number(ym.slice(5, 7)) - 1];
export const monthYear = (ym: string) => `${monthLong(ym)} ${ym.slice(0, 4)}`;
export const dateShort = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${Number(iso.slice(8, 10))}`;
export const dateLong = (iso: string) => `${dateShort(iso)}, ${iso.slice(0, 4)}`;
export const pct = (n: number) => (Number.isInteger(n) ? `${n}%` : `${n.toFixed(2).replace(/0$/, "")}%`);
export const pctInt = (n: number) => `${n}%`;
export const sec = (n: number) => `${n.toFixed(2)}s`;
export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
export const count = (n: number) => (n >= 0 && n < 10 ? WORDS[n] : String(n));
export const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
export const money = (amount: number, symbol: string) => (Number.isInteger(amount) ? `${symbol}${amount}` : `${symbol}${amount.toFixed(2)}`);
// "a, b, and c" with an Oxford comma.
export const joinList = (xs: string[]) =>
  xs.length <= 1 ? xs.join("") : xs.length === 2 ? `${xs[0]} and ${xs[1]}` : `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`;
export const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Value formats a chart can ask for by name (the model stays plain JSON).
export const VALUE_FORMATS: Record<string, (v: number) => string> = { pct, pctInt, int: (v) => String(v), sec };

// Fill a copy template: "Hello {name}" + {name: "Ann"}. A missing key is a bug, so it throws.
export function fill(template: string, vars: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`copy template is missing value for {${k}}: "${template}"`);
    return String(vars[k]);
  });
}
