import reservesWeekly from './raw/reserves_weekly.json';
import { INDICATORS, Point } from './indicators';
import { C } from '../theme';

// Release calendar. `est` marks dates that follow the agency's usual schedule
// rather than an announced date.
export type CalEvent = { k: string; date: string; t: string; src: string; prev: string; est?: boolean; ind?: string };

export const CALENDAR: CalEvent[] = [
  { k: 'res0', date: '2026-10-15', t: 'SBP weekly FX reserves', src: 'SBP', prev: 'Week to 9 Oct · $21.47bn', ind: 'reserves' },
  { k: 'ca', date: '2026-10-19', t: 'Current account, September', src: 'SBP', prev: 'Prev Jul–Aug −$543m', est: true, ind: 'ca' },
  { k: 'res1', date: '2026-10-22', t: 'SBP weekly FX reserves', src: 'SBP', prev: 'Prev $21.47bn', est: true, ind: 'reserves' },
  { k: 'mpc', date: '2026-10-26', t: 'Monetary Policy Committee', src: 'SBP', prev: 'Prev hold 11.50%', ind: 'policy' },
  { k: 'fuel', date: '2026-10-31', t: 'Petroleum price review', src: 'OGRA', prev: 'Prev Rs 393.86', est: true, ind: 'petrol' },
  { k: 'cpi', date: '2026-11-02', t: 'CPI inflation, October', src: 'PBS', prev: 'Prev 10.3%', est: true, ind: 'cpi' },
  { k: 'remit', date: '2026-11-09', t: 'Workers’ remittances, October', src: 'SBP', prev: 'Prev $3.59bn', est: true, ind: 'remit' },
];

export type NewsItem = { src: string; date: string; t: string; tag: string; cat: string; ind?: string };

export const NEWS: NewsItem[] = [
  { src: 'PSX', date: '15 Oct', t: 'KSE-100 closes 768 points higher at 166,189 on bank and energy buying', tag: 'KSE-100', cat: 'Markets', ind: 'kse' },
  { src: 'OGRA', date: '15 Oct', t: 'Petrol raised Rs1.20 to Rs393.86 a litre; diesel trimmed to Rs396.65', tag: 'Fuel prices', cat: 'Markets', ind: 'petrol' },
  { src: 'SBP', date: '15 Oct', t: 'SBP-held reserves edge up to $21.47bn in week to 9 October; total liquid reserves $26.86bn', tag: 'FX reserves', cat: 'SBP', ind: 'reserves' },
  { src: 'SBP', date: '9 Oct', t: 'Workers’ remittances reach $3.59bn in September, up 12.7% year on year', tag: 'Remittances', cat: 'SBP', ind: 'remit' },
  { src: 'IMF', date: '7 Oct', t: 'Staff-level agreement on fourth EFF and third RSF reviews would unlock $1.2bn, subject to IMF Board', tag: 'IMF', cat: 'Other' },
  { src: 'PBS', date: 'Oct', t: 'Q1 FY27 goods trade deficit widens 15% to $10.79bn as imports rise to $19.22bn', tag: 'Trade balance', cat: 'PBS', ind: 'trade' },
  { src: 'PBS', date: '1 Oct', t: 'CPI inflation eases to 10.3% in September from 11.1% in August', tag: 'Inflation', cat: 'PBS', ind: 'cpi' },
  { src: 'APCMA', date: 'Oct', t: 'Cement despatches rise 5.95% to 4.62 million tonnes in September', tag: 'Activity', cat: 'Other' },
  { src: 'SBP', date: '14 Sep', t: 'MPC keeps policy rate at 11.5% by a 7–3 majority; next meeting 26 October', tag: 'Policy rate', cat: 'SBP', ind: 'policy' },
];

export const NEWS_FILTERS = ['All', 'SBP', 'PBS', 'Markets', 'Other'];

// Series available for the indexed comparison.
const series = (id: string) => INDICATORS.find(i => i.id === id)!.series;
export type CompareSeries = { id: string; name: string; color: string; points: Point[] };
export const COMPARE: CompareSeries[] = [
  { id: 'kse', name: 'KSE-100', color: C.green, points: series('kse') },
  { id: 'pkr', name: 'USD/PKR', color: C.blue, points: series('pkr') },
  { id: 'reserves', name: 'SBP reserves', color: C.ink, points: series('reserves') },
  { id: 'banks', name: 'Bank FX reserves', color: C.ochre, points: reservesWeekly.map(r => ({ d: r.week_ended, v: r.banks })) },
  { id: 'cpi', name: 'CPI inflation', color: C.rust, points: series('cpi') },
  { id: 'policy', name: 'Policy rate', color: C.plum, points: series('policy') },
];

// Interbank USD/PKR plus cross rates. EUR/USD and GBP/USD are reference
// crosses; SAR and AED use their USD pegs.
export const FX_USD_PKR = INDICATORS.find(i => i.id === 'pkr')!.value;
export const FX = [
  { code: 'USD', name: 'US dollar', rate: FX_USD_PKR },
  { code: 'EUR', name: 'Euro', rate: FX_USD_PKR * 1.12 },
  { code: 'GBP', name: 'Pound sterling', rate: FX_USD_PKR * 1.33 },
  { code: 'SAR', name: 'Saudi riyal', rate: FX_USD_PKR / 3.75 },
  { code: 'AED', name: 'UAE dirham', rate: FX_USD_PKR / 3.6725 },
];
