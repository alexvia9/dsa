import type { Account, DepositRecord, DsaState, InvestmentStrategy } from '../types/dsa'
import {
  addLocalCalendarDays,
  localDateString,
  toCanonicalLocalYmd,
} from './dateLocal'
import {
  signedLedgerAmountCents,
  sumNetLedgerCents,
} from './ledger'
import { sp500MarketDailyFactor } from './sp500Market'

function ledgerDay(d: DepositRecord): string {
  return toCanonicalLocalYmd(d.recordedAt)
}

/**
 * Piggy bank / savings / month-end models floor value at net flows so small
 * rounding never looks like a loss. Market index must use the raw simulation so
 * real down periods show as negative growth instead of a misleading $0.00.
 */
function displayedTotalValueCents(
  strategy: InvestmentStrategy,
  rawRounded: number,
  netContributionsCents: number,
): number {
  if (strategy.mode === 'stock_market') {
    return rawRounded
  }
  return Math.max(rawRounded, netContributionsCents)
}

function displayedValueThroughDate(
  strategy: InvestmentStrategy,
  rawRounded: number,
  netThroughCents: number,
): number {
  if (strategy.mode === 'stock_market') {
    return rawRounded
  }
  return Math.max(rawRounded, netThroughCents)
}

function lastDayOfMonthString(y: number, month: number): string {
  const d = new Date(y, month, 0).getDate()
  return `${y}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Last calendar day of `YYYY-MM` as YYYY-MM-DD. */
export function lastDayOfMonthYmd(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return lastDayOfMonthString(y, m)
}

/** Last day of the calendar month before `ym`. */
export function previousMonthLastDayYmd(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  if (m === 1) return lastDayOfMonthString(y - 1, 12)
  return lastDayOfMonthString(y, m - 1)
}

/** Every `YYYY-MM` from `fromYm` through `toYm`, inclusive, in order. */
export function enumerateMonthsInclusive(fromYm: string, toYm: string): string[] {
  if (fromYm > toYm) return []
  const out: string[] = []
  let y = Number(fromYm.slice(0, 4))
  let m = Number(fromYm.slice(5, 7))
  const ty = Number(toYm.slice(0, 4))
  const tm = Number(toYm.slice(5, 7))
  for (;;) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    if (y === ty && m === tm) break
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return out
}

/** End of `ym` for valuation: last day of month, or today if this month and today is earlier. */
export function monthEffectiveEndYmd(ym: string, todayYmd: string): string {
  const last = lastDayOfMonthYmd(ym)
  return last < todayYmd ? last : todayYmd
}

function eachCalendarDay(from: string, to: string): string[] {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  const out: string[] = []
  const cur = new Date(fy, fm - 1, fd)
  const end = new Date(ty, tm - 1, td)
  while (cur <= end) {
    out.push(
      `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`,
    )
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

function dailyRateForStrategy(strategy: InvestmentStrategy): number {
  if (strategy.mode === 'piggy_bank') return 0
  if (strategy.mode === 'savings_apr') {
    return strategy.annualRatePercent / 100 / 365
  }
  return 0
}

/** Net ledger through the date range — no compounding (piggy bank). */
function simulatePiggyBank(
  deposits: DepositRecord[],
  startDate: string,
  endDate: string,
): number {
  return deposits
    .filter((d) => {
      const day = ledgerDay(d)
      return day >= startDate && day <= endDate
    })
    .reduce((s, d) => s + signedLedgerAmountCents(d), 0)
}

function simulateDailyCompound(
  strategy: InvestmentStrategy,
  deposits: DepositRecord[],
  startDate: string,
  endDate: string,
): number {
  const byDay = new Map<string, number>()
  for (const dep of deposits) {
    const k = ledgerDay(dep)
    byDay.set(k, (byDay.get(k) ?? 0) + signedLedgerAmountCents(dep))
  }
  let balance = 0

  if (strategy.mode === 'stock_market') {
    for (const day of eachCalendarDay(startDate, endDate)) {
      balance += byDay.get(day) ?? 0
      if (balance > 0) {
        balance *= sp500MarketDailyFactor(day)
      }
    }
    return balance
  }

  const daily = dailyRateForStrategy(strategy)
  for (const day of eachCalendarDay(startDate, endDate)) {
    balance += byDay.get(day) ?? 0
    if (daily > 0 && balance > 0) {
      balance *= 1 + daily
    }
  }
  return balance
}

/** Latest explicit month key in `rates` that is strictly before `firstMonthKey` (YYYY-MM). */
function seedCarriedMonthlyPercent(
  rates: Record<string, number>,
  firstMonthKey: string,
): number {
  let bestKey: string | null = null
  for (const k of Object.keys(rates)) {
    if (k < firstMonthKey && (!bestKey || k > bestKey)) bestKey = k
  }
  if (bestKey === null) return 0
  const v = rates[bestKey]
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function readExplicitMonthlyPercent(
  rates: Record<string, number>,
  monthKey: string,
): number | undefined {
  if (!Object.hasOwn(rates, monthKey)) return undefined
  const v = rates[monthKey]
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function simulateMonthlyEnd(
  deposits: DepositRecord[],
  rates: Record<string, number>,
  startDate: string,
  endDate: string,
): number {
  let balance = 0
  const [sy, sm] = startDate.split('-').map(Number)
  const [ey, em] = endDate.split('-').map(Number)
  let y = sy
  let m = sm

  const firstMonthKey = `${sy}-${String(sm).padStart(2, '0')}`
  let carriedPercent = seedCarriedMonthlyPercent(rates, firstMonthKey)

  for (;;) {
    const key = `${y}-${String(m).padStart(2, '0')}`
    const firstDay = `${key}-01`
    const lastDayStr = lastDayOfMonthString(y, m)

    for (const dep of deposits) {
      const day = ledgerDay(dep)
      if (day >= firstDay && day <= lastDayStr && day <= endDate) {
        balance += signedLedgerAmountCents(dep)
      }
    }

    if (lastDayStr <= endDate) {
      const explicit = readExplicitMonthlyPercent(rates, key)
      if (explicit !== undefined) {
        carriedPercent = explicit
      }
      if (balance > 0) {
        balance *= 1 + carriedPercent / 100
      }
    }

    if (y === ey && m === em) break

    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }

  return balance
}

function simulateTotalValueCents(
  strategy: InvestmentStrategy,
  deposits: DepositRecord[],
  startDate: string,
  endDate: string,
): number {
  if (deposits.length === 0) return 0
  if (strategy.mode === 'piggy_bank') {
    return simulatePiggyBank(deposits, startDate, endDate)
  }
  if (strategy.mode === 'monthly_end_compound') {
    return simulateMonthlyEnd(
      deposits,
      strategy.monthlyRatePercentByMonth,
      startDate,
      endDate,
    )
  }
  return simulateDailyCompound(strategy, deposits, startDate, endDate)
}

/** Earliest deposit date, or account creation date if there are no deposits. */
export function accountStartDate(account: Account, deposits: DepositRecord[]): string {
  if (deposits.length === 0) {
    return toCanonicalLocalYmd(account.createdAt.slice(0, 10))
  }
  return deposits.reduce(
    (min, d) => {
      const k = ledgerDay(d)
      return k < min ? k : min
    },
    ledgerDay(deposits[0]),
  )
}

/**
 * Months shown in the deposits spreadsheet (newest first), and the first
 * calendar month in that range (for month-end % carry-forward).
 */
export function ledgerSpreadsheetMonthRange(
  account: Account,
  deposits: DepositRecord[],
): { monthsDescending: string[]; firstMonthKey: string } {
  const todayInner = localDateString()
  const curYm = todayInner.slice(0, 7)
  const firstMonthKey = deposits.length
    ? accountStartDate(account, deposits).slice(0, 7)
    : curYm
  const maxMonthYm = deposits.reduce(
    (max, d) => {
      const ym = ledgerDay(d).slice(0, 7)
      return ym > max ? ym : max
    },
    curYm,
  )
  const spreadsheetLastYm =
    maxMonthYm > curYm ? maxMonthYm : curYm
  const monthsDescending = enumerateMonthsInclusive(
    firstMonthKey,
    spreadsheetLastYm,
  ).toReversed()
  return { monthsDescending, firstMonthKey }
}

/**
 * Growth % applied at the end of `monthKey` (after explicit row + carry rules
 * used by simulation).
 */
export function effectiveMonthEndPercentForMonth(
  rates: Record<string, number>,
  monthKey: string,
  firstMonthKey: string,
): number {
  if (monthKey < firstMonthKey) {
    return seedCarriedMonthlyPercent(rates, monthKey)
  }
  let carried = seedCarriedMonthlyPercent(rates, firstMonthKey)
  for (const key of enumerateMonthsInclusive(firstMonthKey, monthKey)) {
    const explicit = readExplicitMonthlyPercent(rates, key)
    if (explicit !== undefined) carried = explicit
  }
  return carried
}

export function getAccountGrowthMetrics(
  account: Account,
  deposits: DepositRecord[],
  endDate: string = localDateString(),
): {
  startDate: string
  /** Net cash in minus out (basis for growth). */
  netContributionsCents: number
  totalDepositsInCents: number
  totalWithdrawalsCents: number
  growthCents: number
  totalValueCents: number
} {
  const netContributionsCents = sumNetLedgerCents(deposits)
  const totalDepositsInCents = deposits.reduce(
    (s, d) => (d.kind === 'withdrawal' ? s : s + d.amountCents),
    0,
  )
  const totalWithdrawalsCents = deposits.reduce(
    (s, d) => (d.kind === 'withdrawal' ? s + d.amountCents : s),
    0,
  )
  const startDate = accountStartDate(account, deposits)

  if (deposits.length === 0) {
    return {
      startDate,
      netContributionsCents: 0,
      totalDepositsInCents: 0,
      totalWithdrawalsCents: 0,
      growthCents: 0,
      totalValueCents: 0,
    }
  }

  let raw = simulateTotalValueCents(
    account.strategy,
    deposits,
    startDate,
    endDate,
  )
  raw = Math.round(raw)
  const totalValueCents = displayedTotalValueCents(
    account.strategy,
    raw,
    netContributionsCents,
  )
  const growthCents = totalValueCents - netContributionsCents

  return {
    startDate,
    netContributionsCents,
    totalDepositsInCents,
    totalWithdrawalsCents,
    growthCents,
    totalValueCents,
  }
}

/**
 * Simulated account value at the end of `endDate` (inclusive), in cents.
 * Matches the same rules as the live balance (floor at deposits credited on or before that date).
 * Caps simulation at `asOfDate` so we never project past “today”.
 */
export function accountValueCentsThroughDate(
  account: Account,
  deposits: DepositRecord[],
  endDate: string,
  asOfDate: string = localDateString(),
): number {
  if (deposits.length === 0) return 0
  const startDate = accountStartDate(account, deposits)
  const effectiveEnd = endDate < asOfDate ? endDate : asOfDate
  if (effectiveEnd < startDate) return 0
  const raw = Math.round(
    simulateTotalValueCents(account.strategy, deposits, startDate, effectiveEnd),
  )
  const netThrough = deposits
    .filter((d) => ledgerDay(d) <= effectiveEnd)
    .reduce((s, d) => s + signedLedgerAmountCents(d), 0)
  return displayedValueThroughDate(account.strategy, raw, netThrough)
}

export function sumNetLedgerInCalendarMonth(
  deposits: DepositRecord[],
  ym: string,
): number {
  const prefix = `${ym}-`
  return deposits.reduce((s, d) => {
    const day = ledgerDay(d)
    return day.startsWith(prefix) ? s + signedLedgerAmountCents(d) : s
  }, 0)
}

/** Start / end balance for a month, growth excluding new deposits that month. */
export function monthGrowthBreakdown(
  account: Account,
  deposits: DepositRecord[],
  ym: string,
  todayYmd: string,
): {
  startCents: number
  endCents: number
  netFlowInMonthCents: number
  growthCents: number
} {
  const prevEnd = previousMonthLastDayYmd(ym)
  const periodEnd = monthEffectiveEndYmd(ym, todayYmd)
  const startCents = accountValueCentsThroughDate(
    account,
    deposits,
    prevEnd,
    todayYmd,
  )
  const endCents = accountValueCentsThroughDate(
    account,
    deposits,
    periodEnd,
    todayYmd,
  )
  const netFlowInMonthCents = sumNetLedgerInCalendarMonth(deposits, ym)
  const growthCents = endCents - startCents - netFlowInMonthCents
  return { startCents, endCents, netFlowInMonthCents, growthCents }
}

/** Recompute every account balance from deposits + growth simulation (as of today). */
export function applyGrowthSimulationToState(state: DsaState): DsaState {
  const endDate = localDateString()
  return {
    ...state,
    accounts: state.accounts.map((a) => {
      const deps = state.deposits.filter((d) => d.accountId === a.id)
      const { totalValueCents } = getAccountGrowthMetrics(a, deps, endDate)
      return { ...a, balanceCents: totalValueCents }
    }),
  }
}

function netLedgerFlowOnDate(
  deposits: DepositRecord[],
  ymd: string,
): number {
  return deposits
    .filter((d) => ledgerDay(d) === ymd)
    .reduce((s, d) => s + signedLedgerAmountCents(d), 0)
}

export type AccountListGrowthTrend = {
  deltaCents: number
  periodLabel: string
}

/**
 * Rule-based growth snippet for account list rows (kid page, family mini list).
 * Returns null when the account has no positive balance or when the type has
 * no growth rule to summarize (piggy bank).
 */
export function accountListGrowthTrend(
  account: Account,
  deposits: DepositRecord[],
  todayYmd: string = localDateString(),
): AccountListGrowthTrend | null {
  const { totalValueCents } = getAccountGrowthMetrics(
    account,
    deposits,
    todayYmd,
  )
  if (totalValueCents <= 0) return null
  if (account.strategy.mode === 'piggy_bank') return null
  if (deposits.length === 0) return null

  if (
    account.strategy.mode === 'savings_apr' ||
    account.strategy.mode === 'stock_market'
  ) {
    const yesterday = addLocalCalendarDays(todayYmd, -1)
    const vToday = accountValueCentsThroughDate(
      account,
      deposits,
      todayYmd,
      todayYmd,
    )
    const vYest = accountValueCentsThroughDate(
      account,
      deposits,
      yesterday,
      todayYmd,
    )
    const flowToday = netLedgerFlowOnDate(deposits, todayYmd)
    const growthDelta = vToday - vYest - flowToday
    return { deltaCents: growthDelta, periodLabel: 'Last day' }
  }

  const trendYm = previousMonthLastDayYmd(todayYmd.slice(0, 7)).slice(0, 7)
  const { growthCents } = monthGrowthBreakdown(
    account,
    deposits,
    trendYm,
    todayYmd,
  )
  return { deltaCents: growthCents, periodLabel: 'Last month-end' }
}
