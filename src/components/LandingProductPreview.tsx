import { KidAvatar } from './KidAvatar'
import { StrategyTypeCardIcon } from './icons/StrategyTypeIcons'
import type { KidAvatarColorId } from '../lib/kidAvatarColors'
import { formatUsd } from '../lib/money'
import type { InvestmentStrategy } from '../types/dsa'

type PreviewAccount = {
  name: string
  balanceCents: number
  mode: InvestmentStrategy['mode']
}

type PreviewKid = {
  name: string
  colorId: KidAvatarColorId
  accounts: PreviewAccount[]
}

const PREVIEW_KIDS: PreviewKid[] = [
  {
    name: 'Sam',
    colorId: 'green',
    accounts: [
      { name: 'Piggy bank', balanceCents: 5_000, mode: 'piggy_bank' },
      { name: 'Save', balanceCents: 12_000, mode: 'monthly_end_compound' },
      { name: 'Market', balanceCents: 24_000, mode: 'stock_market' },
    ],
  },
]

function kidTotalCents(kid: PreviewKid): number {
  return kid.accounts.reduce((sum, account) => sum + account.balanceCents, 0)
}

/** One child, the three balances the story is about. */
export function LandingProductPreview() {
  return (
    <div className="landing-preview" aria-hidden>
      <div className="landing-preview-screen family-page">
        <ul className="kids-grid">
          {PREVIEW_KIDS.map((kid) => (
            <li key={kid.name}>
              <article className="card kid-card">
                <div className="kid-card-link">
                  <KidAvatar name={kid.name} colorId={kid.colorId} />
                  <span className="kid-card-summary">
                    <span className="kid-card-name">{kid.name}</span>
                    <span className="kid-card-balance">
                      {formatUsd(kidTotalCents(kid))}
                    </span>
                  </span>
                </div>
                <ul className="kid-card-accounts" aria-label={`${kid.name}'s accounts`}>
                  {kid.accounts.map((account) => (
                    <li
                      key={account.name}
                      className={`kid-card-account kid-card-account--${account.mode}`}
                    >
                      <span className="kid-card-account-leading">
                        <span className="kid-card-account-icon">
                          <StrategyTypeCardIcon mode={account.mode} />
                        </span>
                        <span className="kid-card-account-name">{account.name}</span>
                      </span>
                      <span className="kid-card-account-balance">
                        {formatUsd(account.balanceCents)}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
