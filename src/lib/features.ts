/**
 * Feature flags for gradual rollout.
 */
export const features = {
  /**
   * Published SPY close-to-close change comes from Yahoo Finance.
   * SCALE: keep for now. Replace before a larger audience with a source
   * whose terms allow that illustration inside this app. See README.
   */
  marketDataSource: 'yahoo-chart',
} as const
