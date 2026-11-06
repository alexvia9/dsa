import type { InvestmentStrategy } from '../types/dsa'

/** Suggested learning cap for a new month-end jar. */
export const DEFAULT_MONTH_END_CAP_CENTS = 10_000

export const MOVED_PAST_LEARNING_CAP_NOTE = 'Moved past learning cap'

export function monthEndStrategy(
  monthlyRatePercentByMonth: Record<string, number>,
  capCents?: number,
): InvestmentStrategy {
  if (capCents === undefined) {
    return { mode: 'monthly_end_compound', monthlyRatePercentByMonth }
  }
  return {
    mode: 'monthly_end_compound',
    monthlyRatePercentByMonth,
    capCents,
  }
}

/** Finite, non-negative cap in cents, or undefined when this jar has no cap. */
export function readMonthEndCapCents(
  strategy: InvestmentStrategy,
): number | undefined {
  if (strategy.mode !== 'monthly_end_compound') return undefined
  const cap = strategy.capCents
  if (typeof cap !== 'number' || !Number.isFinite(cap) || cap < 0) return undefined
  return Math.round(cap)
}

export function monthEndExcessCents(
  totalValueCents: number,
  capCents: number,
): number {
  return Math.max(0, totalValueCents - capCents)
}

/**
 * Month-end growth on `balance`. When `capCents` is set, only the slice up to
 * the cap earns `percent`. Dollars above the cap are unchanged.
 */
export function applyMonthEndGrowth(
  balance: number,
  percent: number,
  capCents: number | undefined,
): number {
  if (balance <= 0 || percent === 0) return balance
  const eligible =
    capCents === undefined ? balance : Math.min(balance, capCents)
  if (eligible <= 0) return balance
  return balance + eligible * (percent / 100)
}
