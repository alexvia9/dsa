/**
 * Feature flags for gradual rollout. Flip when backend / AI wiring is ready.
 */
export const features = {
  /** Plain-language performance summary powered by AI (account Performance panel). */
  performanceAiInsight: false,
} as const
