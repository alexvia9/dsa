import { effectiveMonthEndPercentForMonth } from './accountGrowth'
import { accountTypeForMode } from './accountTypeCatalog'
import { readMonthEndCapCents } from './monthEndCap'
import { formatUsd } from './money'
import type { InvestmentStrategy } from '../types/dsa'

export type StrategySummaryOptions = {
  /** When true, market index shows only the catalog name (no benchmark ticker). */
  omitBenchmark?: boolean
}

function formatGrowthPercent(n: number): string {
  if (!Number.isFinite(n)) return '0%'
  const rounded = Math.round(n * 100) / 100
  return `${rounded}%`
}

/**
 * Current growth rate for an informational pill.
 * Month-end uses the percent that applies this month. Market has no fixed rate.
 */
export function growthRateLabel(
  s: InvestmentStrategy,
  opts: { monthKey: string; firstMonthKey: string },
): string {
  switch (s.mode) {
    case 'piggy_bank':
      return '0%'
    case 'savings_apr':
      return `${formatGrowthPercent(s.annualRatePercent)} a year`
    case 'monthly_end_compound':
      return `${formatGrowthPercent(
        effectiveMonthEndPercentForMonth(
          s.monthlyRatePercentByMonth,
          opts.monthKey,
          opts.firstMonthKey,
        ),
      )} this month`
    case 'stock_market':
      return 'Like the market'
  }
}

/** Short line for pills, tables, and aria (uses account type catalog + key numbers). */
export function strategySummary(
  s: InvestmentStrategy,
  opts?: StrategySummaryOptions,
): string {
  const { accountName } = accountTypeForMode(s.mode)
  switch (s.mode) {
    case 'stock_market': {
      if (opts?.omitBenchmark) return accountName
      const tag = s.benchmarkSymbol?.trim()
      return tag ? `${accountName} (${tag})` : accountName
    }
    case 'savings_apr':
      return `${accountName} · ${s.annualRatePercent}%`
    case 'monthly_end_compound': {
      const cap = readMonthEndCapCents(s)
      return cap === undefined
        ? accountName
        : `${accountName} · cap ${formatUsd(cap)}`
    }
    case 'piggy_bank':
      return accountName
  }
}

/** Account-page explanation. Month-end mentions this jar's cap when one is set. */
export function growthExplanation(s: InvestmentStrategy): string {
  if (s.mode !== 'monthly_end_compound') {
    return accountTypeForMode(s.mode).howItWorks
  }
  const cap = readMonthEndCapCents(s)
  if (cap === undefined) {
    return 'Money still moves on deposit and withdrawal dates. The percentage for a month applies once at month-end on the full balance. Set a learning cap when dollars above it should stop earning this rate.'
  }
  return `Money still moves on deposit and withdrawal dates. The month-end percentage applies once, and only to the balance up to ${formatUsd(cap)}. Anything above that earns nothing until you move it to an account that grows like savings or like the market.`
}

/** One short line under the performance numbers. Details stay in “How growth works”. */
export function strategyGrewLine(s: InvestmentStrategy): string {
  switch (s.mode) {
    case 'piggy_bank':
      return 'This jar does not grow on its own. Grew stays $0.00.'
    case 'savings_apr':
      return `Grew is extra from the ${s.annualRatePercent}% savings rate.`
    case 'monthly_end_compound': {
      const cap = readMonthEndCapCents(s)
      if (cap === undefined) {
        return 'Grew is extra added at the end of each month.'
      }
      return `Grew is extra added at the end of each month, only on money up to ${formatUsd(cap)}.`
    }
    case 'stock_market':
      return 'Grew is the pretend market moving this money up or down.'
  }
}
