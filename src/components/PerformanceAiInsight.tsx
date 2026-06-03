import type { Account, DepositRecord } from '../types/dsa'
import type { GrowthChartRange } from '../lib/accountGrowthHistory'
import { features } from '../lib/features'

export type PerformanceAiInsightProps = {
  account: Account
  deposits: DepositRecord[]
  range: GrowthChartRange
  /** Reserved for the AI prompt when {@link features.performanceAiInsight} is enabled. */
  windowFromYmd: string
  windowToYmd: string
  growthInWindowCents: number
  netFlowInWindowCents: number
}

/**
 * Placeholder for AI-generated performance narrative. Enable via
 * `features.performanceAiInsight` once an API route and prompt are in place.
 */
export function PerformanceAiInsight(props: PerformanceAiInsightProps) {
  void props

  if (features.performanceAiInsight) {
    return null
  }

  return (
    <aside
      className="performance-ai-insight performance-ai-insight--planned"
      aria-labelledby="performance-ai-insight-title"
    >
      <div className="performance-ai-insight-head">
        <h3 id="performance-ai-insight-title" className="performance-ai-insight-title">
          Performance insight
        </h3>
        <span className="performance-ai-insight-badge">Coming soon</span>
      </div>
      <p className="performance-ai-insight-lede">
        We&apos;ll use AI to explain this account in plain language—what moved the
        balance in the period you selected, how your growth rules applied, and how
        deposits and withdrawals fit in.
      </p>
      <button
        type="button"
        className="btn secondary btn-compact performance-ai-insight-cta"
        disabled
        aria-describedby="performance-ai-insight-title"
      >
        Explain performance
      </button>
    </aside>
  )
}
