/** Shared simulator notice. Balances are pretend; the parent holds the cash. */
export const SIMULATED_BALANCE_NOTE =
  'Simulated. You hold this cash. DSA does not.'

/**
 * Shown next to a total that includes a like-the-market illustration.
 * Names the source and limits the use to a pretend balance.
 */
export const MARKET_ILLUSTRATION_NOTE =
  'Like the published SPY close-to-close change (source: Yahoo Finance), applied only to this pretend balance. Not a quote, not a data feed, and not for trading.'

/** Shown next to a total when today's market day used the teaching fill. */
export const MARKET_ESTIMATE_NOTE =
  'Where that day’s published close is not available yet, this illustration uses a ~7% yearly teaching estimate for that day only.'

export const FOOTER_LEGAL =
  'Teaching simulator. You hold all real money; DSA does not. Figures can be wrong, delayed, or estimated. Not financial advice and not for trading. DSA is not a bank, there is no deposit, and deposit insurance does not apply. A balance that moves like the market is an illustration of a published daily percentage change, like SPY, sourced from Yahoo Finance. DSA does not offer quotes or a market-data feed. Not affiliated with Yahoo, any bank, brokerage, S&P Dow Jones Indices, or the SPY sponsor.'

/** Public contact. The repo has no operator email. */
export const OPERATOR_CONTACT = 'https://github.com/alexvia9/dsa/issues'
