import type { InvestmentStrategy } from '../types/dsa'

/** Discriminator for `InvestmentStrategy` — simulation logic keys off these modes. */
export type StrategyMode = InvestmentStrategy['mode']

/**
 * Teaching labels for each simulator account type. Does not change behavior;
 * strategy modes and fields in `InvestmentStrategy` remain the source of truth.
 */
export type AccountTypeCatalogEntry = {
  accountName: string
  technicalLabel: string
  /** One-word mood, e.g. Flat, Steady */
  vibeWord: string
  /** Completes the sentence after the vibe word */
  vibeBecause: string
  /** Plain-language rules matching how the simulator applies this mode */
  howItWorks: string
  /** General teaching / family use cases (shown in “How growth works” UI). */
  teachingContext: string
}

export const ACCOUNT_TYPE_BY_MODE: Record<
  StrategyMode,
  AccountTypeCatalogEntry
> = {
  piggy_bank: {
    accountName: 'Piggy Bank',
    technicalLabel: 'Cash / Piggy Bank',
    vibeWord: 'Flat',
    vibeBecause:
      'it holds exactly what is put in with no growth or risk.',
    howItWorks:
      'The balance only changes when you deposit or withdraw—nothing is added by growth rules.',
    teachingContext:
      'Best as a simple comparison when you’re teaching, or for money set aside for donations.',
  },
  savings_apr: {
    accountName: 'Standard Savings (APY)',
    technicalLabel: 'HYSA',
    vibeWord: 'Steady',
    vibeBecause: 'it uses a fixed APY to grow incrementally every day.',
    howItWorks:
      'You set one annual rate; the simulator applies a small daily slice of that rate so the balance rises smoothly, like a high-yield savings teaching model.',
    teachingContext:
      'Best for showing how slow, steady growth works and for introducing APY.',
  },
  monthly_end_compound: {
    accountName: 'Month-End',
    technicalLabel: 'Monthly Compound',
    vibeWord: 'Patience',
    vibeBecause:
      'it only calculates growth from the balance on the last day of each month.',
    howItWorks:
      'Money still moves on deposit and withdrawal dates, but the percentage for a month is applied once at that month’s end on the balance—using the month-by-month rates you set.',
    teachingContext:
      'Best for teaching compounding—especially motivating for newer investors. Month-end percentages can work as rewards or recognition for the month.',
  },
  stock_market: {
    accountName: 'Market Index',
    technicalLabel: 'Stock index (teaching model)',
    vibeWord: 'Wild',
    vibeBecause:
      'it fluctuates based on real-world stock market performance to teach long-term “zoomed out” thinking.',
    howItWorks:
      'Growth uses daily close-to-close returns on the S&P 500 via the SPY ETF (Stooq). Data refreshes when you sign in or create a Market Index account. Non-trading days apply no change. If today’s close is not published yet, a simple ~7% annual stand-in is used for that day.',
    teachingContext:
      'Best for real-world context and comparison examples. A good next step after they understand growth basics and feel excited about it.',
  },
}

export function accountTypeForMode(
  mode: StrategyMode,
): AccountTypeCatalogEntry {
  return ACCOUNT_TYPE_BY_MODE[mode]
}

/**
 * Short growth-model line for compact pickers (e.g. new-account modal).
 * Technical names stay in `ACCOUNT_TYPE_BY_MODE`; this is user-facing only.
 */
export const GROWTH_MODEL_ONE_LINE: Record<StrategyMode, string> = {
  piggy_bank:
    'No growth—the balance only changes when you deposit or withdraw.',
  savings_apr:
    'One fixed yearly rate, smoothed into small daily growth (like HYSA).',
  monthly_end_compound:
    'You set a % per month; it applies once at month-end on the balance.',
  stock_market:
    'Tracks the S&P 500 via SPY daily returns (Stooq); non-trading days are flat. Falls back to a simple stand-in if data is missing.',
}
