import { StrategyTypeCardIcon } from './icons/StrategyTypeIcons'
import type { InvestmentStrategy } from '../types/dsa'

type PreviewAccount = {
  name: string
  balance: string
  change?: string
  positive?: boolean
  mode: InvestmentStrategy['mode']
}

type PreviewKid = {
  name: string
  total: string
  accounts: PreviewAccount[]
}

const PREVIEW_KIDS: PreviewKid[] = [
  {
    name: 'Sam',
    total: '$1,204.30',
    accounts: [
      { name: 'Spending', balance: '$142.00', mode: 'piggy_bank' },
      {
        name: 'Savings',
        balance: '$612.18',
        change: '+$3.42',
        positive: true,
        mode: 'savings_apr',
      },
      {
        name: 'Market Index',
        balance: '$450.12',
        change: '+$18.06',
        positive: true,
        mode: 'stock_market',
      },
    ],
  },
  {
    name: 'Riley',
    total: '$1,643.22',
    accounts: [
      { name: 'Allowance', balance: '$86.50', mode: 'piggy_bank' },
      {
        name: 'Goal Jar',
        balance: '$1,056.72',
        change: '+$12.40',
        positive: true,
        mode: 'monthly_end_compound',
      },
      {
        name: 'Index Fund',
        balance: '$500.00',
        change: '-$4.18',
        positive: false,
        mode: 'stock_market',
      },
    ],
  },
]

function PreviewSparkline() {
  return (
    <svg
      className="landing-preview-sparkline"
      viewBox="0 0 120 32"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="landing-spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0, 166, 81, 0.35)" />
          <stop offset="100%" stopColor="rgba(0, 166, 81, 0)" />
        </linearGradient>
      </defs>
      <path
        d="M0 24 L12 22 L24 18 L36 20 L48 14 L60 16 L72 10 L84 12 L96 6 L108 8 L120 4 L120 32 L0 32 Z"
        fill="url(#landing-spark-fill)"
      />
      <path
        d="M0 24 L12 22 L24 18 L36 20 L48 14 L60 16 L72 10 L84 12 L96 6 L108 8 L120 4"
        fill="none"
        stroke="#00a651"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LandingProductPreview() {
  return (
    <div className="landing-preview" aria-hidden>
      <div className="landing-preview-device">
        <div className="landing-preview-topbar">
          <span className="landing-preview-topbar-title">Kids at a glance</span>
          <span className="landing-preview-topbar-badge">Synced</span>
        </div>

        <div className="landing-preview-balance-card">
          <p className="landing-preview-label">Total tracked</p>
          <p className="landing-preview-balance">$2,847.52</p>
          <div className="landing-preview-balance-meta">
            <span className="landing-preview-change positive">+$48.12</span>
            <span className="landing-preview-change-label">this month</span>
          </div>
          <PreviewSparkline />
        </div>

        <ul className="landing-preview-kids">
          {PREVIEW_KIDS.map((kid) => (
            <li key={kid.name} className="landing-preview-kid">
              <div className="landing-preview-kid-head">
                <span className="landing-preview-kid-avatar" aria-hidden>
                  {kid.name.charAt(0)}
                </span>
                <div className="landing-preview-kid-title">
                  <span className="landing-preview-kid-name">{kid.name}</span>
                  <span className="landing-preview-kid-sub">3 accounts</span>
                </div>
                <span className="landing-preview-kid-total">{kid.total}</span>
              </div>
              <ul className="landing-preview-accounts">
                {kid.accounts.map((account) => (
                  <li
                    key={account.name}
                    className={`landing-preview-account landing-preview-account--${account.mode}`}
                  >
                    <span className="landing-preview-account-leading">
                      <span
                        className="landing-preview-account-icon"
                        aria-hidden
                      >
                        <StrategyTypeCardIcon mode={account.mode} />
                      </span>
                      <span className="landing-preview-account-name">
                        {account.name}
                      </span>
                    </span>
                    <span className="landing-preview-account-trailing">
                      {account.change ? (
                        <span
                          className={
                            'landing-preview-account-change ' +
                            (account.positive ? 'positive' : 'negative')
                          }
                        >
                          {account.change}
                        </span>
                      ) : null}
                      <span className="landing-preview-account-balance">
                        {account.balance}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
