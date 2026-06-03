import { Link, useNavigate } from 'react-router-dom'
import { AddChildFlow } from '../components/AddChildFlow'
import { KidAvatar } from '../components/KidAvatar'
import { StrategyTypeCardIcon } from '../components/icons/StrategyTypeIcons'
import { useDsa } from '../context/DsaContext'
import { confirmCloseChild } from '../lib/confirmCloseChild'
import { homeAppPath } from '../lib/familyRouting'
import { formatUsd } from '../lib/money'

export function FamilyPage() {
  const navigate = useNavigate()
  const { state, familyTotalCents, closeKid } = useDsa()

  return (
    <div className="page family-page">
      <header className="page-header">
        <h1>Your family</h1>
        <p className="lede">
          Tap a child to view accounts, record money in or out, and see how
          their balances grow.
        </p>
      </header>

      <section className="card highlight family-balance-card">
        <h2 className="card-title">Household balance</h2>
        <p className="big-number">{formatUsd(familyTotalCents)}</p>
        <p className="muted small family-balance-meta">
          {state.kids.length} family member
          {state.kids.length === 1 ? '' : 's'}
          {state.kids.length > 0
            ? ` · ${state.accounts.length} account${state.accounts.length === 1 ? '' : 's'}`
            : ''}
        </p>
      </section>

      <section className="family-members-section">
        <h2 className="family-members-heading card-title">Family members</h2>
        <ul className="kids-grid">
          {state.kids.map((kid) => {
            const accounts = state.accounts.filter((a) => a.kidId === kid.id)
            const total = accounts.reduce((s, a) => s + a.balanceCents, 0)
            return (
              <li key={kid.id}>
                <article className="card kid-card">
                  <Link
                    to={`/kids/${kid.id}`}
                    className="kid-card-link"
                    aria-label={`${kid.name}, total balance ${formatUsd(total)}`}
                  >
                    <KidAvatar name={kid.name} colorId={kid.avatarColor} />
                    <span className="kid-card-summary">
                      <span className="kid-card-name">{kid.name}</span>
                      <span className="kid-card-balance">{formatUsd(total)}</span>
                      <span className="kid-card-meta-inline">
                        {accounts.length === 0
                          ? 'No accounts yet'
                          : `${accounts.length} account${accounts.length === 1 ? '' : 's'}`}
                      </span>
                    </span>
                    <span className="kid-card-chevron" aria-hidden>
                      ›
                    </span>
                  </Link>

                  {accounts.length > 0 ? (
                    <ul
                      className="kid-card-accounts"
                      aria-label={`${kid.name}'s accounts`}
                    >
                      {accounts.map((a) => (
                        <li
                          key={a.id}
                          className={`kid-card-account kid-card-account--${a.strategy.mode}`}
                        >
                          <span className="kid-card-account-leading">
                            <span
                              className="kid-card-account-icon"
                              aria-hidden
                            >
                              <StrategyTypeCardIcon mode={a.strategy.mode} />
                            </span>
                            <span className="kid-card-account-name">
                              {a.name}
                            </span>
                          </span>
                          <span className="kid-card-account-balance">
                            {formatUsd(a.balanceCents)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <button
                    type="button"
                    className="kid-card-remove-btn"
                    onClick={() => {
                      if (
                        !confirmCloseChild(kid, accounts.length, total)
                      ) {
                        return
                      }
                      const nextHome = homeAppPath(
                        state.kids.filter((k) => k.id !== kid.id),
                      )
                      closeKid(kid.id)
                      navigate(nextHome)
                    }}
                  >
                    Remove {kid.name}
                  </button>
                </article>
              </li>
            )
          })}
          <AddChildFlow />
        </ul>
      </section>
    </div>
  )
}
