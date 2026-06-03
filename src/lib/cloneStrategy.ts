import type { InvestmentStrategy } from '../types/dsa'

/** Deep enough copy for state updates (avoids shared nested refs). */
export function cloneInvestmentStrategy(s: InvestmentStrategy): InvestmentStrategy {
  if (s.mode === 'stock_market') return { ...s }
  if (s.mode === 'savings_apr') return { ...s }
  if (s.mode === 'piggy_bank') return { mode: 'piggy_bank' }
  return {
    mode: 'monthly_end_compound',
    monthlyRatePercentByMonth: { ...s.monthlyRatePercentByMonth },
  }
}
