import {
  type FormEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AddAccountFlow } from '../components/AddAccountFlow'
import { AccountGrowthTrend } from '../components/AccountGrowthTrend'
import { StrategyTypeCardIcon } from '../components/icons/StrategyTypeIcons'
import { useDsa } from '../context/DsaContext'
import { getAccountGrowthMetrics } from '../lib/accountGrowth'
import { localDateString } from '../lib/dateLocal'
import { formatUsd, parseUsdToCents } from '../lib/money'
import { strategySummary } from '../lib/strategyLabel'
import type { LedgerEntryKind } from '../types/dsa'

export function KidPage() {
  const { kidId } = useParams<{ kidId: string }>()
  const { state, kidById, accountsForKid, renameKid, deposit } = useDsa()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [kidLedgerModalOpen, setKidLedgerModalOpen] = useState(false)
  const [kidLedgerModalKind, setKidLedgerModalKind] =
    useState<LedgerEntryKind>('deposit')
  const [kidLedgerAccountId, setKidLedgerAccountId] = useState('')
  const [kidLedgerDate, setKidLedgerDate] = useState(() => localDateString())
  const [kidLedgerAmount, setKidLedgerAmount] = useState('')
  const [kidLedgerNote, setKidLedgerNote] = useState('')
  const kidDepositDialogRef = useRef<HTMLDialogElement>(null)

  useLayoutEffect(() => {
    const el = kidDepositDialogRef.current
    if (!el) return
    if (kidLedgerModalOpen) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [kidLedgerModalOpen])

  const kidPortfolioMetrics = useMemo(() => {
    if (!kidId) return { totalValueCents: 0, totalGrowthCents: 0 }
    const end = localDateString()
    let totalValueCents = 0
    let totalGrowthCents = 0
    const kidAccounts = state.accounts.filter((a) => a.kidId === kidId)
    for (const a of kidAccounts) {
      const deps = state.deposits.filter((d) => d.accountId === a.id)
      const m = getAccountGrowthMetrics(a, deps, end)
      totalValueCents += m.totalValueCents
      totalGrowthCents += m.growthCents
    }
    return { totalValueCents, totalGrowthCents }
  }, [kidId, state.accounts, state.deposits])

  if (!kidId) {
    return <Navigate to="/" replace />
  }

  const kid = kidById.get(kidId)
  if (!kid) {
    return (
      <div className="page">
        <p>Child not found.</p>
        <Link to="/">Back to family</Link>
      </div>
    )
  }

  const accounts = accountsForKid(kidId)

  const effectiveKidLedgerAccountId =
    kidLedgerAccountId && accounts.some((a) => a.id === kidLedgerAccountId)
      ? kidLedgerAccountId
      : (accounts[0]?.id ?? '')

  const selectedAccount =
    accounts.find((a) => a.id === effectiveKidLedgerAccountId) ?? accounts[0]

  const openKidLedgerModal = (kind: LedgerEntryKind) => {
    setKidLedgerModalKind(kind)
    setKidLedgerDate(localDateString())
    setKidLedgerAmount('')
    setKidLedgerNote('')
    setKidLedgerAccountId((prev) =>
      prev && accounts.some((a) => a.id === prev)
        ? prev
        : (accounts[0]?.id ?? ''),
    )
    setKidLedgerModalOpen(true)
  }

  const closeKidLedgerModal = () => {
    setKidLedgerModalOpen(false)
  }

  const submitKidLedgerEntry = (e: FormEvent) => {
    e.preventDefault()
    if (!effectiveKidLedgerAccountId) return
    const cents = parseUsdToCents(kidLedgerAmount)
    if (cents == null || cents <= 0) return
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(kidLedgerDate.trim())) return
    deposit(effectiveKidLedgerAccountId, cents, {
      recordedAt: kidLedgerDate,
      kind: kidLedgerModalKind,
      note: kidLedgerNote.trim() || undefined,
    })
    kidDepositDialogRef.current?.close()
  }

  return (
    <div className="page kid-page">
      <nav className="breadcrumb">
        <Link to="/">Family</Link>
        <span aria-hidden> / </span>
        <span>{kid.name}</span>
      </nav>

      <header className="page-header kid-dashboard-header">
        <p className="kid-dashboard-eyebrow">Account view</p>
        {editingName ? (
          <form
            className="inline-form title-edit"
            onSubmit={(e) => {
              e.preventDefault()
              renameKid(kidId, nameDraft)
              setEditingName(false)
            }}
          >
            <input
              className="input"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              aria-label="Child name"
            />
            <button type="submit" className="btn secondary">
              Save
            </button>
            <button
              type="button"
              className="btn link"
              onClick={() => setEditingName(false)}
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="title-row name-heading">
            <h1 className="name-heading-title">{kid.name}</h1>
            <button
              type="button"
              className="name-edit-btn"
              onClick={() => {
                setNameDraft(kid.name)
                setEditingName(true)
              }}
              aria-label={`Edit ${kid.name}’s name`}
            >
              <svg
                className="name-edit-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        )}
        <p className="lede kid-dashboard-lede">
          Combined balance and growth across {kid.name}’s accounts. Open an
          account for details, rules, and history.
        </p>
      </header>

      <section
        className="card kid-portfolio-overview"
        aria-label={`${kid.name} portfolio overview`}
      >
        <div className="kid-portfolio-overview-top">
          <h2 className="card-title kid-portfolio-overview-title">Overview</h2>
          <p className="muted small kid-portfolio-overview-meta">
            {accounts.length} account{accounts.length === 1 ? '' : 's'} ·{' '}
            <Link to="/">Family view</Link>
          </p>
        </div>
        <div
          className="kid-portfolio-stats"
          role="group"
          aria-label="Total balance and growth"
        >
          <div className="kid-portfolio-stat kid-portfolio-stat--balance">
            <span className="account-stat-label">Total balance</span>
            <span className="kid-portfolio-stat-value kid-portfolio-stat-value--total">
              {formatUsd(kidPortfolioMetrics.totalValueCents)}
            </span>
          </div>
          <div className="kid-portfolio-stat">
            <span className="account-stat-label">Total growth</span>
            <span
              className={
                'kid-portfolio-stat-value' +
                (kidPortfolioMetrics.totalGrowthCents > 0
                  ? ' account-stat-value-growth-positive'
                  : kidPortfolioMetrics.totalGrowthCents < 0
                    ? ' account-stat-value-growth-negative'
                    : '')
              }
            >
              {formatUsd(kidPortfolioMetrics.totalGrowthCents)}
            </span>
          </div>
        </div>

        {accounts.length > 0 ? (
          <>
            <div
              className="kid-portfolio-quick"
              aria-label="Quick deposit or withdrawal"
            >
              <span className="kid-portfolio-quick-label">Quick entry</span>
              <span className="kid-portfolio-quick-actions">
                <button
                  type="button"
                  className="btn secondary btn-compact kid-portfolio-quick-btn"
                  onClick={() => openKidLedgerModal('deposit')}
                >
                  Deposit
                </button>
                <button
                  type="button"
                  className="btn secondary btn-compact kid-portfolio-quick-btn"
                  onClick={() => openKidLedgerModal('withdrawal')}
                >
                  Withdraw
                </button>
              </span>
            </div>

            <dialog
              ref={kidDepositDialogRef}
              className="strategy-rule-modal"
              onClose={closeKidLedgerModal}
              aria-labelledby="kid-ledger-modal-title"
            >
              <form
                className="strategy-modal-box"
                onSubmit={submitKidLedgerEntry}
              >
                <header className="strategy-modal-header">
                  <h2
                    id="kid-ledger-modal-title"
                    className="strategy-modal-title"
                  >
                    {kidLedgerModalKind === 'withdrawal'
                      ? 'Withdrawal'
                      : 'Deposit'}
                  </h2>
                  <button
                    type="button"
                    className="btn modal-close-btn"
                    onClick={closeKidLedgerModal}
                    aria-label="Close"
                  >
                    ×
                  </button>
                </header>
                <div className="strategy-modal-body deposit-add-modal-body">
                  {selectedAccount ? (
                    <p className="muted small deposit-add-modal-lede">
                      {kidLedgerModalKind === 'withdrawal'
                        ? 'Money leaving '
                        : 'Money into '}
                      <strong>{selectedAccount.name}</strong> ({kid.name}).
                      Simulation uses this date going forward.
                    </p>
                  ) : null}
                  <label className="field ledger-modal-account-field">
                    <span className="label">Account</span>
                    <select
                      className="input ledger-modal-account-select"
                      value={effectiveKidLedgerAccountId}
                      onChange={(e) => setKidLedgerAccountId(e.target.value)}
                      required
                      aria-label="Account for this transaction"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({formatUsd(a.balanceCents)})
                        </option>
                      ))}
                    </select>
                  </label>
                  <fieldset className="ledger-modal-type-fieldset">
                    <legend className="sr-only">Entry type</legend>
                    <label className="radio-row ledger-modal-type-row">
                      <input
                        type="radio"
                        name="kid-ledger-kind"
                        checked={kidLedgerModalKind === 'deposit'}
                        onChange={() => setKidLedgerModalKind('deposit')}
                      />
                      <span>Deposit</span>
                    </label>
                    <label className="radio-row ledger-modal-type-row">
                      <input
                        type="radio"
                        name="kid-ledger-kind"
                        checked={kidLedgerModalKind === 'withdrawal'}
                        onChange={() => setKidLedgerModalKind('withdrawal')}
                      />
                      <span>Withdraw</span>
                    </label>
                  </fieldset>
                  <div className="deposit-add-modal-fields">
                    <label className="field deposit-add-modal-field deposit-add-modal-field-date">
                      <span className="label">Date</span>
                      <input
                        type="date"
                        className="input deposit-add-modal-date"
                        value={kidLedgerDate}
                        onChange={(e) => setKidLedgerDate(e.target.value)}
                        required
                        aria-label="Transaction date"
                      />
                    </label>
                    <label className="field deposit-add-modal-field deposit-add-modal-field-amount">
                      <span className="label">Amount</span>
                      <input
                        className="input deposit-add-modal-amount"
                        inputMode="decimal"
                        value={kidLedgerAmount}
                        onChange={(e) => setKidLedgerAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        aria-label="Amount in dollars"
                      />
                    </label>
                  </div>
                  <label className="field ledger-modal-note-field">
                    <span className="label">Note (optional)</span>
                    <textarea
                      className="input ledger-modal-note"
                      value={kidLedgerNote}
                      onChange={(e) => setKidLedgerNote(e.target.value)}
                      placeholder="e.g. Tooth Fairy, allowance, birthday gift"
                      rows={2}
                      maxLength={500}
                      aria-label="Optional note"
                    />
                  </label>
                </div>
                <footer className="strategy-modal-footer">
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={closeKidLedgerModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn primary">
                    {kidLedgerModalKind === 'withdrawal'
                      ? 'Withdraw'
                      : 'Deposit'}
                  </button>
                </footer>
              </form>
            </dialog>
          </>
        ) : null}
      </section>

      <h2 className="kid-accounts-heading card-title">Accounts</h2>
      {accounts.length === 0 ? (
        <p className="muted kid-accounts-empty">
          No accounts yet — tap <strong>Add an account</strong> on this page
          to create the first one.
        </p>
      ) : null}
      <ul className="account-table">
        {accounts.map((a) => {
          const accountDeposits = state.deposits.filter(
            (d) => d.accountId === a.id,
          )
          return (
          <li key={a.id}>
            <Link
              to={`/accounts/${a.id}`}
              className={`card account-row-link account-row-link--${a.strategy.mode}`}
              aria-label={`${a.name}, balance ${formatUsd(a.balanceCents)}. ${strategySummary(a.strategy, { omitBenchmark: true })}`}
            >
              <div className="account-row-main">
                <div className="account-row-leading">
                  <span className="account-row-strategy-icon" aria-hidden>
                    <StrategyTypeCardIcon mode={a.strategy.mode} />
                  </span>
                  <span className="account-name">{a.name}</span>
                </div>
                <div className="account-row-balance-stack">
                  <span className="account-balance">
                    {formatUsd(a.balanceCents)}
                  </span>
                  <AccountGrowthTrend
                    account={a}
                    deposits={accountDeposits}
                  />
                </div>
              </div>
              <p className="strategy-pill block">
                {strategySummary(a.strategy, { omitBenchmark: true })}
              </p>
            </Link>
          </li>
          )
        })}
        <AddAccountFlow
          kidId={kidId}
          kidName={kid.name}
          afterCreate="account"
        />
      </ul>
    </div>
  )
}
