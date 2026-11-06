import { StrategyTypeCardIcon } from './icons/StrategyTypeIcons'
import {
  GROWTH_MODEL_ONE_LINE,
  accountTypeForMode,
} from '../lib/accountTypeCatalog'
import type { InvestmentStrategy } from '../types/dsa'

const COMPARE_MODES = ['piggy_bank', 'monthly_end_compound'] as const
const REAL_MODES = ['savings_apr', 'stock_market'] as const

const PRODUCT_SPECS: Record<InvestmentStrategy['mode'], string> = {
  piggy_bank: '0% · cash only',
  savings_apr: 'Fixed APY · daily accrual',
  monthly_end_compound: 'Custom % · capped',
  stock_market: 'S&P 500 · SPY daily',
}

const GROUPS = [
  {
    id: 'compare',
    title: 'Two ways to run a jar',
    lede: 'Save, give, and spend can each be a piggy bank or a month-end account. Compare the one that sits still with the one that compounds.',
    modes: COMPARE_MODES,
  },
  {
    id: 'real',
    title: 'When a month-end jar is full',
    lede: 'Open these any time. Money past the learning cap moves here, into steady savings or the market.',
    modes: REAL_MODES,
  },
] as const

type Props = {
  title?: string
  lede?: string
  /** Match landing page section styling. */
  variant?: 'default' | 'landing'
}

export function AccountTypesOverview({
  title = 'How the accounts fit together',
  lede = 'Save, give, and spend are the jars. Piggy bank and month-end are the two ways to compare them. Savings and the market are open whenever you want them.',
  variant = 'default',
}: Props) {
  const isLanding = variant === 'landing'

  return (
    <section
      className={
        isLanding
          ? 'landing-section account-types-overview account-types-overview--landing'
          : 'account-types-overview'
      }
    >
      {isLanding ? (
        <div className="landing-section-head">
          <h2 className="landing-section-title">{title}</h2>
          <p className="landing-section-lede">{lede}</p>
        </div>
      ) : (
        <>
          <h2 className="account-types-overview-title">{title}</h2>
          <p className="muted account-types-overview-lede">{lede}</p>
        </>
      )}
      {GROUPS.map((group) => (
        <div key={group.id} className="account-types-group">
          <h3 className="account-types-group-title">{group.title}</h3>
          <p
            className={
              isLanding
                ? 'landing-section-lede account-types-group-lede'
                : 'muted account-types-group-lede'
            }
          >
            {group.lede}
          </p>
          <ul
            className={
              isLanding
                ? 'strategy-type-card-grid landing-type-grid'
                : 'strategy-type-card-grid account-types-overview-grid'
            }
          >
            {group.modes.map((mode) => {
              const catalog = accountTypeForMode(mode)
              return (
                <li
                  key={mode}
                  className={
                    'strategy-type-card strategy-type-card--' +
                    mode +
                    ' strategy-type-card--selected' +
                    (isLanding
                      ? ' landing-type-card'
                      : ' account-types-overview-card')
                  }
                >
                  <div className="strategy-type-card-top">
                    <span className="strategy-type-card-icon-wrap" aria-hidden>
                      <StrategyTypeCardIcon mode={mode} />
                    </span>
                    <div className="strategy-type-card-heading">
                      <span className="strategy-type-card-title">
                        {catalog.accountName}
                      </span>
                      <span className="strategy-type-card-vibe">
                        {catalog.vibeWord}
                      </span>
                    </div>
                  </div>
                  <span className="landing-product-spec">{PRODUCT_SPECS[mode]}</span>
                  <span className="strategy-type-card-desc">
                    {GROWTH_MODEL_ONE_LINE[mode]}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}
