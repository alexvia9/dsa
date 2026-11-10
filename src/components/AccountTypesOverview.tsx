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
  savings_apr: 'Like a fixed APY · daily accrual',
  monthly_end_compound: 'Custom % · capped',
  stock_market: 'Illustration · like SPY',
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
    lede: 'Open these any time. Money past the learning cap moves here, into something that grows like steady savings or like the market.',
    modes: REAL_MODES,
  },
] as const

/** Homepage framing. The in-app setup page keeps the product wording above. */
const STORY_GROUPS = {
  compare: {
    title: 'Let them see the wait',
    lede: 'They hand you the money. You log it. A piggy bank sits still, and month-end adds your percent once a month, up to a cap, without anyone counting coins.',
  },
  real: {
    title: 'Then like a bank, then like a brokerage',
    lede: 'Savings uses a yearly rate you choose, applied a little each day, like a savings account. The market illustration follows a published daily change, like a brokerage account, and it can go down. You still hold the cash.',
  },
} as const

const STORY_BLURB: Record<InvestmentStrategy['mode'], string> = {
  piggy_bank: 'The cash is with you. The balance changes only when you log money in or out.',
  monthly_end_compound:
    'A percent you choose, once a month, only up to a cap so the lesson stays small.',
  savings_apr:
    'Like a savings account: a yearly rate you choose, applied a little each day.',
  stock_market:
    'Like a brokerage account: a published daily move. The balance can rise or fall. Not a quote.',
}

type Props = {
  title?: string
  lede?: string
  /** Match landing page section styling. */
  variant?: 'default' | 'landing'
  /** Tell the patience-and-investing story. Setup pages keep the product wording. */
  story?: boolean
}

export function AccountTypesOverview({
  title = 'How the accounts fit together',
  lede = 'Save, give, and spend are the jars. Piggy bank and month-end are the two ways to compare them. Accounts that grow like savings or like the market are open whenever you want them.',
  variant = 'default',
  story = false,
}: Props) {
  const isLanding = variant === 'landing'
  const groups = GROUPS.map((group) =>
    story ? { ...group, ...STORY_GROUPS[group.id] } : group,
  )

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
          {lede ? <p className="landing-section-lede">{lede}</p> : null}
        </div>
      ) : (
        <>
          <h2 className="account-types-overview-title">{title}</h2>
          <p className="muted account-types-overview-lede">{lede}</p>
        </>
      )}
      {groups.map((group) => (
        <div key={group.id} className="account-types-group">
          <h3 className="account-types-group-title">{group.title}</h3>
          {group.lede ? (
            <p
              className={
                isLanding
                  ? 'landing-section-lede account-types-group-lede'
                  : 'muted account-types-group-lede'
              }
            >
              {group.lede}
            </p>
          ) : null}
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
                  {story ? null : (
                    <span className="landing-product-spec">
                      {PRODUCT_SPECS[mode]}
                    </span>
                  )}
                  <span className="strategy-type-card-desc">
                    {story ? STORY_BLURB[mode] : GROWTH_MODEL_ONE_LINE[mode]}
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
