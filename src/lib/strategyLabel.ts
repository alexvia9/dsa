import { accountTypeForMode } from './accountTypeCatalog'
import { readMonthEndCapCents } from './monthEndCap'
import { formatUsd } from './money'
import type { InvestmentStrategy } from '../types/dsa'

export type StrategySummaryOptions = {
  /** When true, market index shows only the catalog name (no benchmark ticker). */
  omitBenchmark?: boolean
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

/** One sentence describing what drives rule-based growth (chart window copy). */
export function strategyGrowthBasisLine(s: InvestmentStrategy): string {
  switch (s.mode) {
    case 'piggy_bank':
      return 'No growth rate—only deposits and withdrawals move the balance.'
    case 'savings_apr':
      return `Smooth daily interest from your ${s.annualRatePercent}% annual rate, like a savings account (APY). The balance is pretend.`
    case 'monthly_end_compound': {
      const cap = readMonthEndCapCents(s)
      if (cap === undefined) {
        return 'Month-end compounding using the growth % you set for each calendar month, on the full balance.'
      }
      return `Month-end compounding on the balance up to ${formatUsd(cap)}. Anything above that cap does not earn this rate.`
    }
    case 'stock_market':
      return 'Illustration of the published SPY close-to-close change (source: Yahoo Finance) on a pretend balance, with a ~7% yearly teaching rate until that day’s close is in. Not a quote and not shares of SPY.'
  }
}
