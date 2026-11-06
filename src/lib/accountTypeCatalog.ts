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
      'One way to run a save, give, or spend jar. Nothing grows, so you can compare it with a month-end jar.',
  },
  savings_apr: {
    accountName: 'Standard Savings (APY)',
    technicalLabel: 'HYSA',
    vibeWord: 'Steady',
    vibeBecause: 'it uses a fixed APY to grow incrementally every day.',
    howItWorks:
      'You set one annual rate; the simulator applies a small daily slice of that rate so the balance rises smoothly, like a high-yield savings teaching model.',
    teachingContext:
      'Open any time. Steady, uncapped growth for money that has outgrown a month-end jar.',
  },
  monthly_end_compound: {
    accountName: 'Month-End',
    technicalLabel: 'Monthly Compound',
    vibeWord: 'Patience',
    vibeBecause:
      'it only calculates growth from the balance on the last day of each month.',
    howItWorks:
      'Money still moves when you deposit or withdraw. Once a month, the percentage you set applies only to the balance up to a learning cap. Anything above the cap earns nothing until you move it to savings or the market.',
    teachingContext:
      'The other way to run a save, give, or spend jar. The rate can be generous because the cap keeps it small.',
  },
  stock_market: {
    accountName: 'Market Index',
    technicalLabel: 'Stock index (teaching model)',
    vibeWord: 'Wild',
    vibeBecause:
      'it fluctuates based on real-world stock market performance to teach long-term “zoomed out” thinking.',
    howItWorks:
      "Each trading day, growth follows the real S&P 500 using the SPY ETF (from one market close to the next). Weekends and market holidays stay flat. When you open the app, we pick up the latest published daily returns. If today's close isn't available yet, a simple ~7% annual teaching estimate is used for that day only.",
    teachingContext:
      'Open any time. Real S&P 500 moves, including down months, for money that has outgrown a month-end jar.',
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
    'You set a % per month and a cap. The % applies once at month-end, only up to that cap.',
  stock_market:
    "S&P 500 via SPY daily returns; flat on weekends and holidays. Uses a ~7% teaching estimate until today's close is published.",
}
