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
      'The balance only changes when you deposit or withdraw—nothing is added by growth rules, like cash in a jar.',
    teachingContext:
      'One way to run a save, give, or spend jar. Nothing grows, so you can compare it with a month-end jar.',
  },
  savings_apr: {
    accountName: 'Like standard savings (APY)',
    technicalLabel: 'Like a HYSA',
    vibeWord: 'Steady',
    vibeBecause:
      'it uses a fixed APY to grow a little every day, like a savings account.',
    howItWorks:
      'You set one annual rate. The simulator applies a small daily slice of that rate so the balance rises smoothly, like a high-yield savings account (HYSA). The balance is pretend. You hold any real cash.',
    teachingContext:
      'Open any time. Steady growth, like a savings account, for money that has outgrown a month-end jar.',
  },
  monthly_end_compound: {
    accountName: 'Month-End',
    technicalLabel: 'Monthly Compound',
    vibeWord: 'Patience',
    vibeBecause:
      'it only calculates growth from the balance on the last day of each month.',
    howItWorks:
      'Money still moves when you deposit or withdraw. Once a month, the percentage you set applies only to the balance up to a learning cap. Anything above the cap earns nothing until you move it to an account that grows like savings or like the market.',
    teachingContext:
      'The other way to run a save, give, or spend jar. The rate can be generous because the cap keeps it small.',
  },
  stock_market: {
    accountName: 'Like a market index',
    technicalLabel: 'Illustration, like SPY',
    vibeWord: 'Wild',
    vibeBecause:
      'it illustrates stock-market moves, including down stretches, to teach long-term “zoomed out” thinking.',
    howItWorks:
      'Each trading day, a pretend balance changes by a percentage like the published SPY close-to-close move (source: Yahoo Finance). Weekends and market holidays stay flat. If that day’s close is not available yet, a simple ~7% annual teaching estimate is used for that day only. This is an illustration, not a quote, not a data feed, and not shares of SPY. DSA is not affiliated with Yahoo, S&P Dow Jones Indices, or the SPY sponsor.',
    teachingContext:
      'Open any time. An illustration of daily moves like the S&P 500, including down months, on a pretend balance for money that has outgrown a month-end jar.',
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
    'One fixed yearly rate, smoothed into small daily growth, like a HYSA. The balance is pretend.',
  monthly_end_compound:
    'You set a % per month and a cap. The % applies once at month-end, only up to that cap.',
  stock_market:
    'Illustration of the published SPY close-to-close change (Yahoo Finance) on a pretend balance. Flat on weekends and holidays. A ~7% teaching estimate fills a day whose close is not in yet. Not a quote.',
}
