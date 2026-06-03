import { useState } from 'react'
import { Link } from 'react-router-dom'
import { StrategyTypeCardIcon } from '../components/icons/StrategyTypeIcons'
import { useDsa } from '../context/DsaContext'
import { formatUsd } from '../lib/money'

export function FamilyPage() {
  const { state, familyTotalCents, addKid } = useDsa()
  const [newKidName, setNewKidName] = useState('')

  return (
    <div className="page family-page">
      <header className="page-header">
        <h1>Family</h1>
        <p className="lede">
          Everyone’s accounts in one place. Open a child to deposit, set how
          each account grows, or open a new account.
        </p>
      </header>

      <section className="card highlight">
        <h2 className="card-title">Household balance</h2>
        <p className="big-number">{formatUsd(familyTotalCents)}</p>
      </section>

      <section className="card">
        <h2 className="card-title">Add a child</h2>
        <form
          className="inline-form"
          onSubmit={(e) => {
            e.preventDefault()
            addKid(newKidName)
            setNewKidName('')
          }}
        >
          <input
            className="input"
            value={newKidName}
            onChange={(e) => setNewKidName(e.target.value)}
            placeholder="Name"
            aria-label="Child name"
          />
          <button type="submit" className="btn primary">
            Add child
          </button>
        </form>
      </section>

      <section className="kids-grid">
        {state.kids.map((kid) => {
          const accounts = state.accounts.filter((a) => a.kidId === kid.id)
          const total = accounts.reduce((s, a) => s + a.balanceCents, 0)
          return (
            <article key={kid.id} className="card kid-card">
              <Link
                to={`/kids/${kid.id}`}
                className="kid-card-hero-link"
                aria-label={`${kid.name}: view all accounts (${formatUsd(total)} total)`}
              >
                <div className="kid-card-head">
                  <h2 className="kid-card-name">{kid.name}</h2>
                  <p className="kid-total">{formatUsd(total)}</p>
                </div>
                <span className="kid-card-cta">
                  View {kid.name}’s accounts
                  <span className="kid-card-cta-arrow" aria-hidden>
                    →
                  </span>
                </span>
              </Link>
              <p className="muted small kid-card-meta">
                {accounts.length} account{accounts.length === 1 ? '' : 's'} ·
                balances below · rules and money-in on child’s page
              </p>
              <ul className="account-mini-list account-mini-list-readonly">
                {accounts.map((a) => (
                  <li
                    key={a.id}
                    className={`account-mini-row account-mini-row--${a.strategy.mode}`}
                  >
                    <span className="account-mini-leading">
                      <span className="account-mini-strategy-icon" aria-hidden>
                        <StrategyTypeCardIcon mode={a.strategy.mode} />
                      </span>
                      <span className="account-mini-name">{a.name}</span>
                    </span>
                    <span className="muted account-mini-balance">
                      {formatUsd(a.balanceCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          )
        })}
      </section>

      {state.kids.length === 0 && (
        <p className="muted">Add your first child to get started.</p>
      )}
    </div>
  )
}
