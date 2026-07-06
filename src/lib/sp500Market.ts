/**
 * S&P 500 teaching path: daily returns from bundled/fetched JSON (SPY via Yahoo Finance).
 * Bundled copy loads synchronously so the first balance reconcile matches post-fetch
 * rules (weekends/holidays). Until data exists, weekdays use the ~7% smooth curve.
 */
import { parseLocalDateString } from './dateLocal'
import sp500Bundled from '../data/sp500-daily-returns.json'

const FALLBACK_ANNUAL_PERCENT = 7

const syntheticDailyFactor = () =>
  Math.pow(1 + FALLBACK_ANNUAL_PERCENT / 100, 1 / 365)

function isWeekendYmd(ymd: string): boolean {
  const d = parseLocalDateString(ymd)
  if (!d) return false
  const w = d.getDay()
  return w === 0 || w === 6
}

let returnsByYmd: Record<string, number> | null = null
/** Latest date we have a published close-to-close return for (max key in JSON). */
let lastFetchedReturnDate: string | null = null
/** True once we have usable returns (bundle and/or successful fetch). */
let loadAttempted = false

function seedFromBundled(): void {
  const j: unknown = sp500Bundled
  const ret =
    j &&
    typeof j === 'object' &&
    'returns' in j &&
    (j as { returns?: unknown }).returns &&
    typeof (j as { returns: unknown }).returns === 'object'
      ? ((j as { returns: Record<string, number> }).returns as Record<string, number>)
      : null
  if (!ret || Object.keys(ret).length === 0) return
  returnsByYmd = ret
  lastFetchedReturnDate = Object.keys(ret).reduce((a, b) => (a > b ? a : b))
  loadAttempted = true
}

seedFromBundled()

/** Replace module state. Empty/null is ignored so bundled data stays if fetch fails. */
export function setSp500DailyReturns(m: Record<string, number> | null): void {
  if (!m || Object.keys(m).length === 0) {
    return
  }
  returnsByYmd = { ...m }
  lastFetchedReturnDate = Object.keys(m).reduce((a, b) => (a > b ? a : b))
  loadAttempted = true
}

/** Merge new return days into bundled/static data (newer keys win on overlap). */
export function mergeSp500DailyReturns(m: Record<string, number> | null): void {
  if (!m || Object.keys(m).length === 0) return
  returnsByYmd = returnsByYmd ? { ...returnsByYmd, ...m } : { ...m }
  lastFetchedReturnDate = Object.keys(returnsByYmd).reduce((a, b) =>
    a > b ? a : b,
  )
  loadAttempted = true
}

/** Latest YYYY-MM-DD with a published SPY close-to-close return. */
export function sp500MarketAsOf(): string | null {
  return lastFetchedReturnDate
}

/** Multiplier applied to balance after ledger flows on that calendar day (1 + daily return). */
export function sp500MarketDailyFactor(ymd: string): number {
  if (!loadAttempted || !returnsByYmd) {
    if (isWeekendYmd(ymd)) return 1
    return syntheticDailyFactor()
  }
  const r = returnsByYmd[ymd]
  if (typeof r === 'number' && Number.isFinite(r)) {
    return 1 + r
  }
  if (isWeekendYmd(ymd)) {
    return 1
  }
  // Weekday with no bar: usually a market holiday in history, or “today” before
  // Today’s close is not published yet — use teaching fallback so growth
  // isn’t stuck at $0 for same-day deposits.
  if (lastFetchedReturnDate && ymd > lastFetchedReturnDate) {
    return syntheticDailyFactor()
  }
  return 1
}
