import {
  type FormEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { AddAccountFlow } from '../components/AddAccountFlow'
import { AddChildFlow } from '../components/AddChildFlow'
import { AccountGrowthTrend } from '../components/AccountGrowthTrend'
import { FamilyBreadcrumb } from '../components/FamilyBreadcrumb'
import { KidAvatar } from '../components/KidAvatar'
import { KidAvatarColorPicker } from '../components/KidAvatarColorPicker'
import { StrategyTypeCardIcon } from '../components/icons/StrategyTypeIcons'
import { useDsa } from '../context/DsaContext'
import { getAccountGrowthMetrics } from '../lib/accountGrowth'
import { localDateString } from '../lib/dateLocal'
import { formatUsd, parseUsdToCents } from '../lib/money'
import { strategySummary } from '../lib/strategyLabel'
import { confirmCloseChild } from '../lib/confirmCloseChild'
import { homeAppPath, showFamilyOverview } from '../lib/familyRouting'
import type { KidAvatarColorId } from '../lib/kidAvatarColors'
import type { LedgerEntryKind } from '../types/dsa'

export function KidPage() {
  const { kidId } = useParams<{ kidId: string }>()
  const navigate = useNavigate()
  const {
    state,
    kidById,
    accountsForKid,
    renameKid,
    setKidAvatarColor,
    deposit,
    closeKid,
  } = useDsa()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [avatarColorDraft, setAvatarColorDraft] = useState<KidAvatarColorId>('green')
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
    if (!kidId) {
      return {
        totalValueCents: 0,
        totalGrowthCents: 0,
        totalDepositsInCents: 0,
        totalWithdrawalsCents: 0,
      }
    }
    const end = localDateString()
    let totalValueCents = 0
    let totalGrowthCents = 0
    let totalDepositsInCents = 0
    let totalWithdrawalsCents = 0
    const kidAccounts = state.accounts.filter((a) => a.kidId === kidId)
    for (const a of kidAccounts) {
      const deps = state.deposits.filter((d) => d.accountId === a.id)
      const m = getAccountGrowthMetrics(a, deps, end)
      totalValueCents += m.totalValueCents
      totalGrowthCents += m.growthCents
      totalDepositsInCents += m.totalDepositsInCents
      totalWithdrawalsCents += m.totalWithdrawalsCents
    }
    return {
      totalValueCents,
      totalGrowthCents,
      totalDepositsInCents,
      totalWithdrawalsCents,
    }
  }, [kidId, state.accounts, state.deposits])

  if (!kidId) {
    return <Navigate to={homeAppPath(state.kids)} replace />
  }

  const kid = kidById.get(kidId)
  if (!kid) {
    return (
      <div className="page">
        <p>Child not found.</p>
        <Link to={homeAppPath(state.kids)}>Back home</Link>
      </div>
    )
  }

  const accounts = accountsForKid(kidId)
  const growthClass =
    kidPortfolioMetrics.totalGrowthCents > 0
      ? 'account-fidelity-change--positive'
      : kidPortfolioMetrics.totalGrowthCents < 0
        ? 'account-fidelity-change--negative'
        : ''

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
      <nav
        className="breadcrumb account-fidelity-breadcrumb"
        aria-label="Breadcrumb"
      >
        <FamilyBreadcrumb />
        <span aria-current="page">{kid.name}</span>
      </nav>

      <section
        className="account-fidelity-summary kid-fidelity-summary"
        aria-label={`${kid.name} portfolio overview`}
      >
        <div className="account-fidelity-summary-head kid-fidelity-summary-head">
          {editingName ? (
            <form
              className="kid-profile-edit kid-fidelity-profile-edit"
              onSubmit={(e) => {
                e.preventDefault()
                renameKid(kidId, nameDraft)
                if (avatarColorDraft !== kid.avatarColor) {
                  setKidAvatarColor(kidId, avatarColorDraft)
                }
                setEditingName(false)
              }}
            >
              <div className="kid-profile-edit-panel">
                <div className="kid-profile-edit-identity">
                  <KidAvatar
                    name={nameDraft || kid.name}
                    colorId={avatarColorDraft}
                    className="kid-profile-edit-avatar"
                  />
                  <KidAvatarColorPicker
                    value={avatarColorDraft}
                    onChange={setAvatarColorDraft}
                    label="Profile color"
                    compact
                  />
                </div>
                <label className="field kid-profile-edit-field">
                  <span className="label">Name</span>
                  <input
                    className="input kid-profile-edit-input"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </label>
                <div className="kid-profile-edit-actions">
                  <button type="submit" className="btn primary">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setEditingName(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="kid-fidelity-identity">
              <KidAvatar
                name={kid.name}
                colorId={kid.avatarColor}
                className="kid-fidelity-avatar"
              />
              <div className="kid-fidelity-identity-copy">
                <span className="account-fidelity-product-type">
                  Child profile
                </span>
                <div className="account-fidelity-name-row">
                  <h1 className="account-fidelity-name">{kid.name}</h1>
                  <button
                    type="button"
                    className="account-fidelity-name-edit"
                    onClick={() => {
                      setNameDraft(kid.name)
                      setAvatarColorDraft(kid.avatarColor)
                      setEditingName(true)
                    }}
                    aria-label={`Edit ${kid.name}’s profile`}
                  >
                    Edit profile
                  </button>
                </div>
              </div>
            </div>
          )}
          {accounts.length > 0 && !editingName ? (
            <div
              className="kid-fidelity-quick-actions"
              aria-label="Quick deposit or withdrawal"
            >
              <button
                type="button"
                className="btn primary btn-compact"
                onClick={() => openKidLedgerModal('deposit')}
              >
                Deposit
              </button>
              <button
                type="button"
                className="btn secondary btn-compact account-fidelity-btn-outline"
                onClick={() => openKidLedgerModal('withdrawal')}
              >
                Withdraw
              </button>
            </div>
          ) : null}
        </div>

        <div className="account-fidelity-balance-block">
          <p className="account-fidelity-balance-label">Total value</p>
          <p className="account-fidelity-balance">
            {formatUsd(kidPortfolioMetrics.totalValueCents)}
          </p>
          <p className={`account-fidelity-change ${growthClass}`}>
            <span className="account-fidelity-change-label">Total growth</span>
            <span className="account-fidelity-change-value">
              {formatUsd(kidPortfolioMetrics.totalGrowthCents)}
            </span>
          </p>
        </div>

        <dl className="account-fidelity-meta">
          <div className="account-fidelity-meta-item">
            <dt>Accounts</dt>
            <dd>
              {accounts.length} account{accounts.length === 1 ? '' : 's'}
            </dd>
          </div>
          {showFamilyOverview(state.kids.length) ? (
            <div className="account-fidelity-meta-item">
              <dt>Family</dt>
              <dd>
                <Link to="/family">Household overview</Link>
              </dd>
            </div>
          ) : null}
        </dl>

        <div
          className="account-fidelity-metrics"
          role="group"
          aria-label="Portfolio totals"
        >
          <div className="account-fidelity-metric">
            <span className="account-fidelity-metric-label">Deposits</span>
            <span className="account-fidelity-metric-value">
              {formatUsd(kidPortfolioMetrics.totalDepositsInCents)}
            </span>
          </div>
          <div className="account-fidelity-metric">
            <span className="account-fidelity-metric-label">Withdrawals</span>
            <span className="account-fidelity-metric-value">
              {formatUsd(-kidPortfolioMetrics.totalWithdrawalsCents)}
            </span>
          </div>
          <div className="account-fidelity-metric">
            <span className="account-fidelity-metric-label">Net growth</span>
            <span
              className={`account-fidelity-metric-value ${growthClass}`}
            >
              {formatUsd(kidPortfolioMetrics.totalGrowthCents)}
            </span>
          </div>
        </div>

        {accounts.length === 0 ? (
          <p className="account-fidelity-empty-hint">
            Add an account below to start teaching {kid.name} how money grows.
          </p>
        ) : null}

        {accounts.length > 0 ? (
          <>
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

      <section
        className="account-fidelity-panel kid-fidelity-accounts"
        aria-labelledby="kid-accounts-heading"
      >
        <div className="account-fidelity-panel-head">
          <div className="account-fidelity-panel-head-copy">
            <h2 id="kid-accounts-heading" className="account-fidelity-panel-title">
              Accounts
            </h2>
            <p className="account-fidelity-panel-lede">
              Holdings for {kid.name} — open an account for rules, performance,
              and transaction history.
            </p>
          </div>
        </div>

        {accounts.length > 0 ? (
          <div className="kid-fidelity-holdings-header" aria-hidden="true">
            <span className="kid-fidelity-holdings-col-account">Account</span>
            <span className="kid-fidelity-holdings-col-type">Type</span>
            <span className="kid-fidelity-holdings-col-balance">Balance</span>
            <span className="kid-fidelity-holdings-col-change">Change</span>
          </div>
        ) : null}

        <ul
          className={
            accounts.length === 0
              ? 'kid-fidelity-holdings kid-fidelity-holdings--no-accounts'
              : 'kid-fidelity-holdings'
          }
        >
          {accounts.map((a) => {
            const accountDeposits = state.deposits.filter(
              (d) => d.accountId === a.id,
            )
            return (
              <li
                key={a.id}
                className={`kid-fidelity-holding-item kid-fidelity-holding-item--${a.strategy.mode}`}
              >
                <Link
                  to={`/accounts/${a.id}`}
                  className={`kid-fidelity-holding-row account-row-link--${a.strategy.mode}`}
                  aria-label={`${a.name}, balance ${formatUsd(a.balanceCents)}. ${strategySummary(a.strategy, { omitBenchmark: true })}`}
                >
                  <span className="kid-fidelity-holding-account">
                    <span
                      className="account-fidelity-product-icon kid-fidelity-holding-icon"
                      aria-hidden
                    >
                      <StrategyTypeCardIcon mode={a.strategy.mode} />
                    </span>
                    <span className="kid-fidelity-holding-name">{a.name}</span>
                  </span>
                  <span className="kid-fidelity-holding-type muted small">
                    {strategySummary(a.strategy, { omitBenchmark: true })}
                  </span>
                  <span className="kid-fidelity-holding-balance">
                    {formatUsd(a.balanceCents)}
                  </span>
                  <span className="kid-fidelity-holding-change">
                    <AccountGrowthTrend
                      account={a}
                      deposits={accountDeposits}
                    />
                  </span>
                </Link>
              </li>
            )
          })}
          <AddAccountFlow
            kidId={kidId}
            kidName={kid.name}
            afterCreate="account"
            prominentWhenEmpty={accounts.length === 0}
          />
        </ul>
      </section>

      {state.kids.length === 1 ? (
        <div className="kid-family-actions">
          <section className="account-fidelity-panel kid-family-action-card">
            <h2 className="account-fidelity-panel-title">Add another child</h2>
            <p className="muted small kid-family-action-lede">
              Unlock the family overview — everyone&apos;s balances on one
              screen.
            </p>
            <AddChildFlow
              variant="standalone"
              navigateTo="family"
              ctaLabel="Add another child"
            />
          </section>
          <section className="account-fidelity-panel kid-family-action-card">
            <h2 className="account-fidelity-panel-title">Remove child</h2>
            <p className="muted small kid-family-action-lede">
              Remove <strong>{kid.name}</strong> and all{' '}
              {accounts.length === 1
                ? 'their account'
                : `${accounts.length} accounts`}
              {accounts.length === 0 ? ' (none yet)' : ''} from your family.
            </p>
            <button
              type="button"
              className="btn secondary kid-family-action-btn account-close-btn"
              onClick={() => {
                if (
                  !confirmCloseChild(
                    kid,
                    accounts.length,
                    kidPortfolioMetrics.totalValueCents,
                  )
                ) {
                  return
                }
                const nextHome = homeAppPath(
                  state.kids.filter((k) => k.id !== kidId),
                )
                closeKid(kidId)
                navigate(nextHome)
              }}
            >
              Remove {kid.name}
            </button>
          </section>
        </div>
      ) : (
        <section className="account-fidelity-panel kid-family-action-card">
          <h2 className="account-fidelity-panel-title">Remove child</h2>
          <p className="muted small kid-family-action-lede">
            Remove <strong>{kid.name}</strong> and all{' '}
            {accounts.length === 1
              ? 'their account'
              : `${accounts.length} accounts`}
            {accounts.length === 0 ? ' (none yet)' : ''} from your family.
          </p>
          <button
            type="button"
            className="btn secondary kid-family-action-btn account-close-btn"
            onClick={() => {
              if (
                !confirmCloseChild(
                  kid,
                  accounts.length,
                  kidPortfolioMetrics.totalValueCents,
                )
              ) {
                return
              }
              const nextHome = homeAppPath(
                state.kids.filter((k) => k.id !== kidId),
              )
              closeKid(kidId)
              navigate(nextHome)
            }}
          >
            Remove {kid.name}
          </button>
        </section>
      )}
    </div>
  )
}
