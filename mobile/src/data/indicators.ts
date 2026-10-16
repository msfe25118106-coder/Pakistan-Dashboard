// Watchlist indicators, built from the "Pakistan economic indicators" dashboard
// datasets (compiled 15–16 Oct 2026). The raw files live in ./raw; replace them
// to refresh the app's figures.
import rawIndicators from './raw/indicators.json';
import cpiMonthly from './raw/cpi_monthly.json';
import kseMonthly from './raw/kse_monthly.json';
import policyRate from './raw/policy_rate.json';
import reservesWeekly from './raw/reserves_weekly.json';
import remitCountry from './raw/remit_country.json';
import tradeQ1 from './raw/trade_q1.json';
import gdpSectors from './raw/gdp_sectors.json';
import usdPkrReady from './raw/usd_pkr_ready.json';
import { num, signed, withUnit, MINUS } from './format';

export type RawIndicator = {
  key: string;
  group: string;
  indicator: string;
  value: number | string;
  unit: string;
  period: string;
  prev: number | null;
  prev_label: string | null;
  change: string;
  good_when: 'up' | 'down' | null;
};

export type Point = { d: string; v: number };
export type Goodness = -1 | 0 | 1;

export type Breakdown = {
  title: string;
  rows: { label: string; value: number; text: string; hot?: boolean }[];
  max: number;
  note?: string;
};

export type AlertSpec = {
  dir: 'above' | 'below';
  defaultThr: number;
  step: number;
  fmt: (v: number) => string;
};

export type Indicator = {
  id: string;
  name: string;
  ur: string;
  value: number;
  display: string;
  chg: string;
  good: Goodness;
  per: string;
  source: string;
  asOf: string;
  series: Point[];
  seriesNote?: string;
  axisFmt: (v: number) => string;
  domain?: [number, number];
  target?: { lo: number; hi: number; label: string };
  breakdown?: Breakdown;
  related: string[];
  alert?: AlertSpec;
};

const RAW = rawIndicators as RawIndicator[];
export const raw = (key: string): RawIndicator => {
  const r = RAW.find(x => x.key === key);
  if (!r) throw new Error('Missing indicator ' + key);
  return r;
};
export const rawMaybe = (key: string) => RAW.find(x => x.key === key);
const n = (key: string) => raw(key).value as number;

const cpi = raw('cpi');
const cpiSeries = cpiMonthly.map(r => ({ d: r.month + '-01', v: r.cpi_yoy }));
const cpiPrev = cpiSeries[cpiSeries.length - 2];

// Policy rate as in force at each month end, from MPC decisions.
const policySeries: Point[] = (() => {
  const out: Point[] = [];
  const decisions = policyRate.map(p => ({ d: p.date, v: p.rate }));
  for (let y = 2025, m = 10; y < 2026 || (y === 2026 && m <= 9); m === 12 ? (y++, m = 1) : m++) {
    const end = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
    const inForce = decisions.filter(p => p.d <= end).pop();
    if (inForce) out.push({ d: end, v: inForce.v });
  }
  return out;
})();
const lastDecision = policyRate[policyRate.length - 1];

const pkr = raw('pkr_usd');
const pkrSeries: Point[] = [
  { d: '2025-12-31', v: raw('pkr_end2025').value as number },
  ...usdPkrReady.map(r => ({ d: r.date, v: r.ready })),
  { d: '2026-10-16', v: pkr.value as number },
];

const resSeries = reservesWeekly.map(r => ({ d: r.week_ended, v: r.sbp }));
const resLast = reservesWeekly[reservesWeekly.length - 1];
const resPrev = reservesWeekly[reservesWeekly.length - 2];

const kse = raw('kse100');
const kseSeries = kseMonthly.map(r => ({ d: r.date, v: r.close }));
const kseDay = 768; // "+768 on the day" in the dashboard
const kseDayPct = (kseDay / ((kse.value as number) - kseDay)) * 100;

const ca = raw('current_account');
const remit = raw('remittances');
const petrol = raw('petrol');
const gold = raw('gold');
const tradeQ = raw('trade_deficit_q1');
const gdp = raw('gdp_growth');
const unemp = raw('unemployment');

const prevPoint = (r: RawIndicator, d: string, value = r.value as number): Point[] =>
  r.prev == null ? [] : [{ d, v: r.prev }, { d: '9999-01-01', v: value }];

const BASE: Indicator[] = [
  {
    id: 'cpi', name: 'CPI inflation', ur: 'افراطِ زر',
    value: n('cpi'), display: num(n('cpi'), 1) + '%',
    chg: `${signed(n('cpi') - cpiPrev.v, 1)} pp vs Aug`, good: 1,
    per: 'Sep 2026 · PBS', source: 'PBS · MONTHLY',
    asOf: `September 2026, year on year · +${num(n('cpi_mom'), 1)}% m/m`,
    series: cpiSeries, axisFmt: v => num(v, 0) + '%',
    domain: [0, 12], target: { lo: 5, hi: 7, label: 'SBP TARGET 5–7%' },
    breakdown: {
      title: 'WHAT MOVED · YOY BY GROUP',
      rows: [['Transport', 27.4], ['Communication', 13.5], ['Housing & utilities', 12.4], ['Food', 8.2], ['Health', 7.9]]
        .map(([label, v]) => ({ label: label as string, value: v as number, text: num(v as number, 1) + '%', hot: (v as number) > 10 })),
      max: 30,
      note: 'Group figures from the PBS September release.',
    },
    related: ['cpi_mom', 'cpi_urban', 'cpi_rural', 'core', 'cpi_q1', 'spi_yoy'],
    alert: { dir: 'above', defaultThr: 11, step: 0.5, fmt: v => num(v, 1) + '%' },
  },
  {
    id: 'policy', name: 'SBP policy rate', ur: 'پالیسی ریٹ',
    value: n('policy_rate'), display: num(n('policy_rate'), 2) + '%',
    chg: 'Hold', good: 0,
    per: 'MPC 14 Sep · 7–3 vote', source: 'SBP · MPC',
    asOf: `${lastDecision.decision} on 14 Sep 2026 · next MPC 26 Oct`,
    series: policySeries, seriesNote: 'Rate in force at each month end.', axisFmt: v => num(v, 1) + '%',
    breakdown: {
      title: 'MPC DECISIONS',
      rows: policyRate.slice().reverse().map(p => ({ label: p.date.slice(0, 7) + ' · ' + p.decision, value: p.rate, text: num(p.rate, 2) + '%', hot: p.decision.startsWith('Hike') })),
      max: 12,
    },
    related: ['kibor_6m', 'kibor_1y', 'tbill_3m', 'tbill_6m', 'tbill_12m'],
  },
  {
    id: 'pkr', name: 'USD/PKR', ur: 'ڈالر / روپیہ',
    value: n('pkr_usd'), display: num(n('pkr_usd'), 2),
    chg: signed(n('pkr_usd') - (pkr.prev as number), 2), good: 1,
    per: 'Interbank · 16 Oct', source: 'SBP · DAILY',
    asOf: 'Rupees per US dollar, interbank · 16 Oct 2026',
    series: pkrSeries, seriesNote: 'Month ends are SBP ready rates for revaluation.', axisFmt: v => num(v, 0),
    related: ['pkr_end2025'],
    alert: { dir: 'above', defaultThr: 280, step: 1, fmt: v => num(v, 0) },
  },
  {
    id: 'reserves', name: 'SBP reserves', ur: 'زرمبادلہ کے ذخائر',
    value: n('sbp_reserves'), display: `$${num(n('sbp_reserves'), 2)}bn`,
    chg: `${(resLast.sbp - resPrev.sbp) >= 0 ? '+' : MINUS}$${num(Math.abs(resLast.sbp - resPrev.sbp) * 1000, 0)}m 2wk`, good: 1,
    per: 'Week to 9 Oct', source: 'SBP · WEEKLY',
    asOf: 'Held by SBP, week to 9 Oct 2026 · vs 25 Sep',
    series: resSeries, axisFmt: v => '$' + num(v, 0) + 'bn',
    breakdown: {
      title: 'LIQUID RESERVES · 9 OCT',
      rows: [
        { label: 'SBP', value: resLast.sbp, text: `$${num(resLast.sbp, 2)}bn` },
        { label: 'Commercial banks', value: resLast.banks, text: `$${num(resLast.banks, 2)}bn` },
        { label: 'Total', value: resLast.total, text: `$${num(resLast.total, 2)}bn` },
      ],
      max: 30,
      note: 'The September jump followed a $3bn Eurobond issue.',
    },
    related: ['imf_tranche', 'imf_disbursed'],
    alert: { dir: 'below', defaultThr: 20, step: 0.5, fmt: v => `$${num(v, 1)}bn` },
  },
  {
    id: 'kse', name: 'KSE-100', ur: 'کے ایس ای ۱۰۰',
    value: n('kse100'), display: num(n('kse100'), 0),
    chg: signed(kseDayPct, 2) + '%', good: 1,
    per: 'Close 15 Oct · PSX', source: 'PSX · DAILY',
    asOf: `Close 15 Oct 2026 · ${signed(kseDay)} pts on the day`,
    series: kseSeries, seriesNote: 'Month-end closes; Oct to Feb not in the dataset.', axisFmt: v => num(v / 1000, 0) + 'k',
    related: ['kse_ath', 'kse_fytd'],
    alert: { dir: 'below', defaultThr: 160000, step: 2000, fmt: v => num(v, 0) },
  },
  {
    id: 'ca', name: 'Current account', ur: 'کرنٹ اکاؤنٹ',
    value: n('current_account'), display: withUnit((n('current_account') * 1000), '$ mn'),
    chg: `vs ${withUnit((ca.prev as number) * 1000, '$ mn')}`, good: 1,
    per: 'Jul–Aug FY27 · SBP', source: 'SBP · MONTHLY',
    asOf: `July–August FY27 · ${ca.change}`,
    series: prevPoint(ca, '2025-08-31'), axisFmt: v => num(v, 1),
    related: ['ca_aug', 'net_fdi', 'portfolio'],
  },
  {
    id: 'remit', name: 'Remittances', ur: 'ترسیلاتِ زر',
    value: n('remittances'), display: `$${num(n('remittances'), 2)}bn`,
    chg: remit.change, good: 1,
    per: 'Sep 2026 · SBP', source: 'SBP · MONTHLY',
    asOf: `September 2026 · vs $${num(remit.prev as number, 2)}bn a year earlier`,
    series: prevPoint(remit, '2025-09-30'), axisFmt: v => '$' + num(v, 1) + 'bn',
    breakdown: {
      title: 'TOP SOURCES · SEP 2026',
      rows: remitCountry.map(r => ({ label: r.country, value: r.usd_mn, text: `$${num(r.usd_mn, 0)}m` })),
      max: 1000,
    },
    related: ['remit_q1'],
    alert: { dir: 'below', defaultThr: 3, step: 0.1, fmt: v => `$${num(v, 1)}bn` },
  },
  {
    id: 'petrol', name: 'Petrol', ur: 'پیٹرول',
    value: n('petrol'), display: `Rs ${num(n('petrol'), 2)}`,
    chg: signed(n('petrol') - (petrol.prev as number), 2), good: -1,
    per: 'Per litre · from 15 Oct', source: 'OGRA · FORTNIGHTLY',
    asOf: 'Per litre, from 15 Oct 2026',
    series: prevPoint(petrol, '2026-10-01'), axisFmt: v => num(v, 0),
    related: ['diesel', 'petroleum_sales'],
    alert: { dir: 'above', defaultThr: 390, step: 5, fmt: v => 'Rs ' + num(v, 0) },
  },
  {
    id: 'gold', name: 'Gold 24K', ur: 'سونا',
    value: n('gold'), display: `Rs ${num(n('gold'), 0)}`,
    chg: '$' + gold.change.replace(/^international \$/, '').replace('/oz', '') + '/oz', good: 0,
    per: 'Per tola · Sarafa', source: 'SARAFA · DAILY',
    asOf: `Per tola, 15 Oct 2026 · ${gold.change}`,
    series: [], axisFmt: v => num(v, 0),
    related: [],
    alert: { dir: 'above', defaultThr: 450000, step: 5000, fmt: v => 'Rs ' + num(v, 0) },
  },
  {
    id: 'trade', name: 'Trade balance', ur: 'تجارتی توازن',
    value: -n('trade_deficit_q1'), display: `${MINUS}$${num(n('trade_deficit_q1'), 2)}bn`,
    chg: tradeQ.change.replace(' y/y', ' wider'), good: -1,
    per: 'Goods · Q1 FY27 · PBS', source: 'PBS · MONTHLY',
    asOf: `Goods, July–September FY27 · vs ${MINUS}$${num(tradeQ.prev as number, 2)}bn`,
    series: prevPoint(tradeQ, '2025-09-30', -n('trade_deficit_q1')).map(p => ({ ...p, v: p.d === '9999-01-01' ? p.v : -p.v })),
    axisFmt: v => num(v, 0),
    breakdown: {
      title: 'GOODS TRADE · Q1, $BN',
      rows: tradeQ1.flatMap(r => [
        { label: `${r.period} exports`, value: r.exports, text: `$${num(r.exports, 2)}bn` },
        { label: `${r.period} imports`, value: r.imports, text: `$${num(r.imports, 2)}bn`, hot: r.period.endsWith('27') },
      ]),
      max: 20,
    },
    related: ['exports', 'imports', 'trade_deficit', 'textile_q1'],
  },
  {
    id: 'gdp', name: 'GDP growth', ur: 'معاشی شرح نمو',
    value: n('gdp_growth'), display: num(n('gdp_growth'), 1) + '%',
    chg: `${signed(n('gdp_growth') - (gdp.prev as number), 1)} pp`, good: 1,
    per: 'FY26 provisional · NAC', source: 'PBS · ANNUAL',
    asOf: `FY26 provisional · ${gdp.change}`,
    series: prevPoint(gdp, '2025-06-30'), axisFmt: v => num(v, 1) + '%',
    breakdown: {
      title: 'REAL GROWTH BY SECTOR · FY26',
      rows: gdpSectors.map(r => ({ label: r.sector, value: r.growth, text: num(r.growth, 1) + '%' })),
      max: 5,
    },
    related: ['gdp_proj', 'gdp_size', 'per_capita', 'lsm', 'lsm_fy26'],
  },
  {
    id: 'unemp', name: 'Unemployment', ur: 'بے روزگاری',
    value: n('unemployment'), display: num(n('unemployment'), 1) + '%',
    chg: `${signed(n('unemployment') - (unemp.prev as number), 1)} pp`, good: -1,
    per: 'Labour Force Survey 24–25', source: 'PBS · LFS',
    asOf: `Labour Force Survey 2024-25 · ${unemp.change}`,
    series: prevPoint(unemp, '2021-06-30'), axisFmt: v => num(v, 1) + '%',
    related: ['population', 'poverty_wb', 'poverty_420'],
  },
];

export const INDICATORS: Indicator[] = BASE.map(ind => ({
  ...ind,
  // Two-point "series" from prev → latest: put the latest point at the last real date.
  series: ind.series.map(p => (p.d === '9999-01-01' ? { ...p, d: '2026-10-15' } : p)),
}));

export const byId = (id: string) => INDICATORS.find(i => i.id === id);

export const DATA_AS_OF = '16 Oct 2026';
