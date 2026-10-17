// Branded primitives. A plain string cannot be passed where a SiteId or Month is expected;
// the only way to get one is the parse function, which checks the format once at the boundary.
declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type SiteId = Brand<string, "SiteId">;
export type Month = Brand<string, "Month">; // YYYY-MM
export type IsoDate = Brand<string, "IsoDate">; // YYYY-MM-DD
export type Sha256 = Brand<string, "Sha256">;

const SITE_ID = /^[a-z0-9][a-z0-9-]*$/;
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const SHA = /^[0-9a-f]{64}$/;

function parser<T>(re: RegExp, what: string) {
  return (s: unknown): T => {
    if (typeof s !== "string" || !re.test(s)) throw new Error(`not a ${what}: ${JSON.stringify(s)}`);
    return s as T;
  };
}
export const parseSiteId = parser<SiteId>(SITE_ID, "site id (lowercase letters, digits, dashes)");
export const parseMonth = parser<Month>(MONTH, "month (YYYY-MM)");
export const parseIsoDate = parser<IsoDate>(ISO_DATE, "date (YYYY-MM-DD)");
export const parseSha256 = parser<Sha256>(SHA, "sha256 hex digest");
export const isMonth = (s: string): s is Month => MONTH.test(s);
