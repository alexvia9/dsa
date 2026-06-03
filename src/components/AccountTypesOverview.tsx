import { StrategyTypeCardIcon } from './icons/StrategyTypeIcons'
import {
  GROWTH_MODEL_ONE_LINE,
  accountTypeForMode,
} from '../lib/accountTypeCatalog'
import type { InvestmentStrategy } from '../types/dsa'

const MODES = [
  'piggy_bank',
  'savings_apr',
  'monthly_end_compound',
  'stock_market',
] as const satisfies readonly InvestmentStrategy['mode'][]

const PRODUCT_SPECS: Record<
  InvestmentStrategy['mode'],
  { spec: string; tag: string }
> = {
  piggy_bank: { spec: '0% · cash only', tag: 'Spending' },
  savings_apr: { spec: 'Fixed APY · daily accrual', tag: 'Savings' },
  monthly_end_compound: { spec: 'Custom % · month-end', tag: 'Goals' },
  stock_market: { spec: 'S&P 500 · SPY daily', tag: 'Investing' },
}

type Props = {
  title?: string
  lede?: string
  /** Match landing page section styling. */
  variant?: 'default' | 'landing'
}

export function AccountTypesOverview({
  title = 'Account types you can open',
  lede = 'Each child can have multiple accounts — pick a different growth style per jar or brokerage line.',
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
      <ul
        className={
          isLanding
            ? 'strategy-type-card-grid landing-type-grid'
            : 'strategy-type-card-grid account-types-overview-grid'
        }
      >
        {MODES.map((mode) => {
          const catalog = accountTypeForMode(mode)
          const product = PRODUCT_SPECS[mode]
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
                <span className="landing-product-tag">{product.tag}</span>
              </div>
              <span className="landing-product-spec">{product.spec}</span>
              <span className="strategy-type-card-desc">
                {GROWTH_MODEL_ONE_LINE[mode]}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
