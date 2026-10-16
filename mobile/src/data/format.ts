export const MINUS = '−';

export function num(v: number, digits = 0): string {
  const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return (v < 0 ? MINUS : '') + s;
}

export function signed(v: number, digits = 0): string {
  return (v > 0 ? '+' : '') + num(v, digits);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

// "Sep 26" — chart axis label.
export function monthYY(iso: string): string {
  const d = parseDate(iso);
  return MONTHS[d.getUTCMonth()] + ' ' + String(d.getUTCFullYear()).slice(2);
}

// "15 Oct" — or "15 Oct 25" when the year differs from `refYear`.
export function dayMonth(iso: string, refYear?: number): string {
  const d = parseDate(iso);
  const base = d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
  return refYear != null && d.getUTCFullYear() !== refYear ? base + ' ' + String(d.getUTCFullYear()).slice(2) : base;
}

export function mastheadDate(d: Date): string {
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
}

export function calParts(iso: string) {
  const d = parseDate(iso);
  return { wd: DAYS[d.getUTCDay()], d: String(d.getUTCDate()).padStart(2, '0'), m: MONTHS[d.getUTCMonth()].toUpperCase() };
}

// Formats a value from the dashboard's indicator table using its unit.
export function withUnit(v: number | string, unit: string): string {
  if (typeof v === 'string') return unit === '%' ? v + '%' : unit ? `${v} ${unit}` : v;
  const digits = Math.abs(v) >= 1000 ? 0 : Math.abs(v) >= 100 ? 1 : 2;
  const trim = (x: number) => {
    const s = Math.abs(x).toLocaleString('en-US', { maximumFractionDigits: digits });
    return (x < 0 ? MINUS : '') + s;
  };
  const n = trim(v);
  const abs = trim(Math.abs(v));
  const sign = v < 0 ? MINUS : '';
  switch (unit) {
    case '%': return n + '%';
    case '% y/y': return n + '% y/y';
    case '% of GDP': return n + '% of GDP';
    case '$ bn': return `${sign}$${abs}bn`;
    case '$ mn': return `${sign}$${abs}m`;
    case '$': return `$${abs}`;
    case 'Rs bn': return `${sign}Rs ${abs}bn`;
    case 'Rs': return `Rs ${n}`;
    case 'Rs/litre': return `Rs ${n}/L`;
    case 'Rs/tola': return `Rs ${n}/tola`;
    case 'Rs/kWh': return `Rs ${n}/kWh`;
    case 'pts': return n;
    case '': return n;
    default: return `${n} ${unit}`;
  }
}
