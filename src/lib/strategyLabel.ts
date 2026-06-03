import { accountTypeForMode } from './accountTypeCatalog'
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
    case 'monthly_end_compound':
      return accountName
    case 'piggy_bank':
      return accountName
  }
}

/** One sentence describing what drives rule-based growth (chart window copy). */
export function strategyGrowthBasisLine(s: InvestmentStrategy): string {
  switch (s.mode) {
    case 'piggy_bank':
      return 'No growth rate—only deposits and withdrawals move the balance.'
    case 'savings_apr':
      return `Smooth daily interest from your ${s.annualRatePercent}% annual rate (APR).`
    case 'monthly_end_compound':
      return 'Month-end compounding using the growth % you set for each calendar month.'
    case 'stock_market':
      return 'Daily S&P 500 (SPY) close-to-close returns from bundled history, with a small teaching rate on recent weekdays when the latest trading day is not in the file yet.'
  }
}
