import type { Account, DepositRecord } from '../types/dsa'
import {
  accountStartDate,
  accountValueCentsThroughDate,
} from './accountGrowth'
import {
  addLocalCalendarDays,
  addLocalCalendarMonths,
  addLocalCalendarYears,
  localDateString,
  toCanonicalLocalYmd,
} from './dateLocal'
import { signedLedgerAmountCents } from './ledger'

export type GrowthChartRange = '1m' | '3m' | '1y'

export type GrowthChartPoint = {
  date: string
  valueCents: number
}

/**
 * First calendar day in the chart: step back from **today** by one month,
 * three months, or one year (full range is always shown, even if the account
 * is newer — days before the first deposit are $0).
 */
export function growthChartWindowStart(
  preset: GrowthChartRange,
  todayYmd: string,
): string {
  if (preset === '1m') return addLocalCalendarMonths(todayYmd, -1)
  if (preset === '3m') return addLocalCalendarMonths(todayYmd, -3)
  return addLocalCalendarYears(todayYmd, -1)
}

function enumerateDaysInclusive(fromYmd: string, toYmd: string): string[] {
  if (fromYmd > toYmd) return []
  const out: string[] = []
  let cur = fromYmd
  const maxDays = 800
  for (let i = 0; i < maxDays && cur <= toYmd; i++) {
    out.push(cur)
    cur = addLocalCalendarDays(cur, 1)
  }
  return out
}

function ledgerDay(d: DepositRecord): string {
  return toCanonicalLocalYmd(d.recordedAt)
}

function netLedgerFlowInWindow(
  deposits: DepositRecord[],
  fromYmd: string,
  toYmd: string,
): number {
  return deposits.reduce((s, d) => {
    const day = ledgerDay(d)
    if (day >= fromYmd && day <= toYmd) return s + signedLedgerAmountCents(d)
    return s
  }, 0)
}

/**
 * Rule-based growth inside the chart window: end value minus value the day before
 * the window starts, minus net ledger flows dated inside the window (same basis as
 * month growth breakdowns).
 */
export function growthChartWindowBreakdown(
  account: Account,
  deposits: DepositRecord[],
  preset: GrowthChartRange,
  todayYmd: string = localDateString(),
): {
  windowFromYmd: string
  windowToYmd: string
  startValueCents: number
  endValueCents: number
  netFlowInWindowCents: number
  growthInWindowCents: number
} {
  const windowFromYmd = growthChartWindowStart(preset, todayYmd)
  const windowToYmd = todayYmd

  const endValueCents =
    deposits.length === 0
      ? 0
      : accountValueCentsThroughDate(
          account,
          deposits,
          windowToYmd,
          todayYmd,
        )

  const dayBeforeWindow = addLocalCalendarDays(windowFromYmd, -1)
  const ledgerStart =
    deposits.length === 0 ? windowToYmd : accountStartDate(account, deposits)

  let startValueCents = 0
  if (deposits.length > 0 && dayBeforeWindow >= ledgerStart) {
    startValueCents = accountValueCentsThroughDate(
      account,
      deposits,
      dayBeforeWindow,
      todayYmd,
    )
  }

  const netFlowInWindowCents =
    deposits.length === 0
      ? 0
      : netLedgerFlowInWindow(deposits, windowFromYmd, windowToYmd)

  const growthInWindowCents =
    endValueCents - startValueCents - netFlowInWindowCents

  return {
    windowFromYmd,
    windowToYmd,
    startValueCents,
    endValueCents,
    netFlowInWindowCents,
    growthInWindowCents,
  }
}

/**
 * One point per calendar day in the window (inclusive), end-of-day balance.
 * Before the first ledger date, value is 0 so the x-axis always spans the full
 * selected range from today.
 */
export function buildGrowthChartSeries(
  account: Account,
  deposits: DepositRecord[],
  preset: GrowthChartRange,
  todayYmd: string = localDateString(),
): GrowthChartPoint[] {
  const from = growthChartWindowStart(preset, todayYmd)
  const to = todayYmd
  const days = enumerateDaysInclusive(from, to)
  if (days.length === 0) return []

  if (deposits.length === 0) {
    return days.map((date) => ({ date, valueCents: 0 }))
  }

  const ledgerStart = accountStartDate(account, deposits)
  return days.map((date) => ({
    date,
    valueCents:
      date < ledgerStart
        ? 0
        : accountValueCentsThroughDate(account, deposits, date, todayYmd),
  }))
}
