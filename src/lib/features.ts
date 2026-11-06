/**
 * Feature flags for gradual rollout. Flip when backend / AI wiring is ready.
 */
export const features = {
  /**
   * Published SPY close-to-close change comes from Yahoo Finance.
   * SCALE: keep for now. Replace before a larger audience with a source
   * whose terms allow that illustration inside this app. See README.
   */
  marketDataSource: 'yahoo-chart',
  /**
   * Plain-language performance summary. Keep off until a vendor agreement
   * is in place. The prompt must explain rules already applied to the
   * pretend balance and must not recommend a purchase, sale, or allocation.
   */
  performanceAiInsight: false,
} as const
