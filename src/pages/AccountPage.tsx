import {
  type FormEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { AccountGrowthChart } from '../components/AccountGrowthChart'
import { StrategyTypeCardIcon } from '../components/icons/StrategyTypeIcons'
import { LedgerMonthEndGrowthField } from '../components/MonthEndRatesByLedgerMonth'
import { StrategyEditor } from '../components/StrategyEditor'
import { useDsa } from '../context/DsaContext'
import { localDateString } from '../lib/dateLocal'
import {
  getAccountGrowthMetrics,
  ledgerSpreadsheetMonthRange,
  monthGrowthBreakdown,
} from '../lib/accountGrowth'
import { formatMonthYearLabel } from '../lib/formatMonthYm'
import { cloneInvestmentStrategy } from '../lib/cloneStrategy'
import { signedLedgerAmountCents } from '../lib/ledger'
import { formatUsd, parseUsdToCents } from '../lib/money'
import { strategySummary } from '../lib/strategyLabel'
import type {
  Account,
  DepositRecord,
  InvestmentStrategy,
  LedgerEntryKind,
} from '../types/dsa'

function formatRecordedDate(ymd: string): string {
  const parts = ymd.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n)))
    return ymd
  const [y, m, d] = parts
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(y, m - 1, d),
  )
}

function confirmRemoveLedgerEntry(record: DepositRecord): boolean {
  const msg =
    record.kind === 'withdrawal'
      ? 'Remove this withdrawal? The account balance will go up by this amount.'
      : 'Remove this deposit? The account balance will go down by this amount.'
  return window.confirm(msg)
}

type LedgerTableMode =
  | { kind: 'paged'; visibleCount: number }
  | { kind: 'calendarYear' }
  | { kind: 'last12' }

const LEDGER_CTA_MESSAGE_MS = 3500

function monthListsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((ym, i) => ym === b[i])
}

function AccountLedgerSection({
  account,
  deposits,
  monthsDescending,
  firstMonthKey,
  monthEndRatesEdit,
  onEditDeposit,
  deleteDeposit,
}: {
  account: Account
  deposits: DepositRecord[]
  monthsDescending: string[]
  firstMonthKey: string
  monthEndRatesEdit: null | {
    rates: Record<string, number>
    onRatesChange: (r: Record<string, number>) => void
  }
  onEditDeposit: (record: DepositRecord) => void
  deleteDeposit: (id: string) => void
}) {
  const [ledgerMode, setLedgerMode] = useState<LedgerTableMode>(() => ({
    kind: 'paged',
    visibleCount: 3,
  }))
  const [ledgerCtaMessage, setLedgerCtaMessage] = useState<string | null>(
    null,
  )

  const todayYmd = localDateString()
  const currentMonthYm = todayYmd.slice(0, 7)
  const currentCalendarYear = Number(todayYmd.slice(0, 4))

  const displayedMonths = useMemo(() => {
    if (monthsDescending.length === 0) return []
    if (ledgerMode.kind === 'paged') {
      return monthsDescending.slice(0, ledgerMode.visibleCount)
    }
    if (ledgerMode.kind === 'last12') {
      return monthsDescending.slice(0, Math.min(12, monthsDescending.length))
    }
    return monthsDescending.filter(
      (ym) => Number(ym.slice(0, 4)) === currentCalendarYear,
    )
  }, [monthsDescending, ledgerMode, currentCalendarYear])

  const monthsThisYear = monthsDescending.filter(
    (ym) => Number(ym.slice(0, 4)) === currentCalendarYear,
  )

  const last12Slice = monthsDescending.slice(
    0,
    Math.min(12, monthsDescending.length),
  )

  const loadMoreInactive =
    ledgerMode.kind !== 'paged' ||
    ledgerMode.visibleCount >= monthsDescending.length

  const displayThisYearInactive =
    monthsThisYear.length === 0 ||
    ledgerMode.kind === 'calendarYear' ||
    monthListsEqual(displayedMonths, monthsThisYear)

  const loadLast12Inactive =
    monthsDescending.length === 0 ||
    ledgerMode.kind === 'last12' ||
    monthListsEqual(displayedMonths, last12Slice)

  const flashLedgerCtaMessage = () => {
    setLedgerCtaMessage('No more info to display')
    window.setTimeout(() => setLedgerCtaMessage(null), LEDGER_CTA_MESSAGE_MS)
  }

  return (
    <div
      className="deposit-spreadsheet"
      role="region"
      aria-label="Transactions by month"
    >
      {displayedMonths.length === 0 && monthsDescending.length > 0 ? (
        <p className="muted deposit-ledger-empty-view">
          Nothing in this range — try another option below.
        </p>
      ) : null}
      {displayedMonths.map((ym) => {
        const monthDeposits = deposits.filter(
          (d) => d.recordedAt.slice(0, 7) === ym,
        )
        const showTotals = ym <= currentMonthYm
        const breakdown = showTotals
          ? monthGrowthBreakdown(account, deposits, ym, todayYmd)
          : null
        return (
          <div key={ym} className="deposit-month-block">
            <div className="deposit-month-block-head">
              <div className="deposit-month-head-row">
                <h3 className="deposit-month-heading">
                  {formatMonthYearLabel(ym)}
                </h3>
                {monthEndRatesEdit ? (
                  <LedgerMonthEndGrowthField
                    variant="monthHeader"
                    ym={ym}
                    firstMonthKey={firstMonthKey}
                    rates={monthEndRatesEdit.rates}
                    onRatesChange={monthEndRatesEdit.onRatesChange}
                  />
                ) : null}
              </div>
              {breakdown && (
                <div
                  className="deposit-month-summary"
                  role="group"
                  aria-label={`${formatMonthYearLabel(ym)} balance summary`}
                >
                  <div className="deposit-month-metric">
                    <span className="deposit-month-metric-label">
                      Total start
                    </span>
                    <span className="deposit-month-metric-value">
                      {formatUsd(breakdown.startCents)}
                    </span>
                  </div>
                  <div className="deposit-month-metric">
                    <span className="deposit-month-metric-label">Total end</span>
                    <span className="deposit-month-metric-value">
                      {formatUsd(breakdown.endCents)}
                    </span>
                  </div>
                  <div className="deposit-month-metric">
                    <span className="deposit-month-metric-label">
                      Total growth
                    </span>
                    <span className="deposit-month-metric-value">
                      {formatUsd(breakdown.growthCents)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {!showTotals && monthDeposits.length > 0 && (
              <p className="muted small deposit-month-future-note">
                Month totals appear once this month is current or in the past.
              </p>
            )}
            {monthDeposits.length === 0 ? (
              <p className="muted small deposit-month-empty">
                No activity this month.
              </p>
            ) : (
              <ul className="deposit-list deposit-list-tight">
                {monthDeposits.map((d) => (
                  <li key={d.id} className="deposit-list-item">
                    <DepositViewRow
                      record={d}
                      onEdit={() => onEditDeposit(d)}
                      onDelete={() => {
                        if (confirmRemoveLedgerEntry(d)) {
                          deleteDeposit(d.id)
                        }
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
      <div className="deposit-ledger-cta-footer">
        <div className="deposit-ledger-cta-row">
          <button
            type="button"
            className={
              loadMoreInactive
                ? 'btn secondary btn-compact deposit-ledger-cta deposit-ledger-cta--inactive'
                : 'btn secondary btn-compact deposit-ledger-cta'
            }
            onClick={() => {
              if (loadMoreInactive) {
                flashLedgerCtaMessage()
                return
              }
              setLedgerMode((m) =>
                m.kind === 'paged'
                  ? {
                      kind: 'paged',
                      visibleCount: Math.min(
                        m.visibleCount + 3,
                        monthsDescending.length,
                      ),
                    }
                  : m,
              )
            }}
          >
            Load more
          </button>
          <button
            type="button"
            className={
              displayThisYearInactive
                ? 'btn secondary btn-compact deposit-ledger-cta deposit-ledger-cta--inactive'
                : 'btn secondary btn-compact deposit-ledger-cta'
            }
            onClick={() => {
              if (displayThisYearInactive) {
                flashLedgerCtaMessage()
                return
              }
              setLedgerMode({ kind: 'calendarYear' })
            }}
          >
            Display this year
          </button>
          <button
            type="button"
            className={
              loadLast12Inactive
                ? 'btn secondary btn-compact deposit-ledger-cta deposit-ledger-cta--inactive'
                : 'btn secondary btn-compact deposit-ledger-cta'
            }
            onClick={() => {
              if (loadLast12Inactive) {
                flashLedgerCtaMessage()
                return
              }
              setLedgerMode({ kind: 'last12' })
            }}
          >
            Load last 12 months
          </button>
        </div>
        {ledgerCtaMessage ? (
          <p className="deposit-ledger-cta-message" role="status">
            {ledgerCtaMessage}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function AccountPage() {
  const { accountId } = useParams<{ accountId: string }>()
  const {
    state,
    accountById,
    kidById,
    deposit,
    setStrategy,
    renameAccount,
    updateDeposit,
    deleteDeposit,
  } = useDsa()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [ledgerModalMode, setLedgerModalMode] = useState<'add' | 'edit'>('add')
  const [ledgerEditingId, setLedgerEditingId] = useState<string | null>(null)
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false)
  const [ledgerModalKind, setLedgerModalKind] =
    useState<LedgerEntryKind>('deposit')
  const [newLedgerDate, setNewLedgerDate] = useState(() => localDateString())
  const [newLedgerAmount, setNewLedgerAmount] = useState('')
  const [newLedgerNote, setNewLedgerNote] = useState('')
  const [strategyModalOpen, setStrategyModalOpen] = useState(false)
  const [strategyDraft, setStrategyDraft] = useState<InvestmentStrategy | null>(
    null,
  )
  /** Keeps latest rule in sync before React re-renders (fix Save right after Add month). */
  const strategyDraftRef = useRef<InvestmentStrategy | null>(null)
  const strategyDialogRef = useRef<HTMLDialogElement>(null)
  const depositDialogRef = useRef<HTMLDialogElement>(null)
  const account = accountId ? accountById.get(accountId) : undefined

  const deposits = useMemo(
    () =>
      accountId
        ? state.deposits
            .filter((d) => d.accountId === accountId)
            .slice()
            .sort((a, b) => {
              const byDate = b.recordedAt.localeCompare(a.recordedAt)
              if (byDate !== 0) return byDate
              return b.createdAt.localeCompare(a.createdAt)
            })
        : [],
    [state.deposits, accountId],
  )

  const ledgerMonthRange = useMemo(() => {
    if (!account) {
      const cur = localDateString().slice(0, 7)
      return { monthsDescending: [] as string[], firstMonthKey: cur }
    }
    return ledgerSpreadsheetMonthRange(account, deposits)
  }, [account, deposits])

  useLayoutEffect(() => {
    const el = strategyDialogRef.current
    if (!el) return
    if (strategyModalOpen) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [strategyModalOpen])

  useLayoutEffect(() => {
    const el = depositDialogRef.current
    if (!el) return
    if (ledgerModalOpen) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [ledgerModalOpen])

  if (!accountId) {
    return <Navigate to="/" replace />
  }

  if (!account) {
    return (
      <div className="page">
        <p>Account not found.</p>
        <Link to="/">Family</Link>
      </div>
    )
  }

  const kid = kidById.get(account.kidId)
  const metrics = getAccountGrowthMetrics(account, deposits)

  const openStrategyModal = () => {
    const draft = cloneInvestmentStrategy(account.strategy)
    strategyDraftRef.current = draft
    setStrategyDraft(draft)
    setStrategyModalOpen(true)
  }

  const closeStrategyModal = () => {
    setStrategyModalOpen(false)
    setStrategyDraft(null)
    strategyDraftRef.current = null
  }

  const openLedgerModal = (kind: LedgerEntryKind) => {
    setLedgerModalMode('add')
    setLedgerEditingId(null)
    setLedgerModalKind(kind)
    setNewLedgerDate(localDateString())
    setNewLedgerAmount('')
    setNewLedgerNote('')
    setLedgerModalOpen(true)
  }

  const openLedgerModalForEdit = (record: DepositRecord) => {
    setLedgerModalMode('edit')
    setLedgerEditingId(record.id)
    setLedgerModalKind(record.kind)
    setNewLedgerDate(record.recordedAt)
    setNewLedgerAmount((record.amountCents / 100).toFixed(2))
    setNewLedgerNote(record.note ?? '')
    setLedgerModalOpen(true)
  }

  const closeLedgerModal = () => {
    setLedgerModalOpen(false)
    setLedgerEditingId(null)
    setLedgerModalMode('add')
  }

  const submitLedgerEntry = (e: FormEvent) => {
    e.preventDefault()
    const cents = parseUsdToCents(newLedgerAmount)
    if (cents == null || cents <= 0) return
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(newLedgerDate.trim())) return
    const trimmed = newLedgerNote.trim()
    if (ledgerModalMode === 'edit' && ledgerEditingId) {
      updateDeposit(ledgerEditingId, {
        amountCents: cents,
        recordedAt: newLedgerDate,
        kind: ledgerModalKind,
        note: trimmed === '' ? null : trimmed,
      })
    } else {
      deposit(accountId, cents, {
        recordedAt: newLedgerDate,
        kind: ledgerModalKind,
        note: trimmed || undefined,
      })
    }
    depositDialogRef.current?.close()
  }

  const handleStrategyDraftChange = (next: InvestmentStrategy) => {
    strategyDraftRef.current = next
    setStrategyDraft(next)
  }

  const saveStrategyFromModal = () => {
    if (account.strategy.mode !== 'monthly_end_compound') return
    const toSave =
      strategyDraftRef.current ??
      strategyDraft ??
      null
    if (!toSave || toSave.mode !== 'monthly_end_compound') return
    setStrategy(accountId, {
      mode: 'monthly_end_compound',
      monthlyRatePercentByMonth: {
        ...toSave.monthlyRatePercentByMonth,
      },
    })
    strategyDialogRef.current?.close()
  }

  return (
    <div className="page account-page">
      <nav className="breadcrumb">
        <Link to="/">Family</Link>
        {kid && (
          <>
            <span aria-hidden> / </span>
            <Link to={`/kids/${kid.id}`}>{kid.name}</Link>
          </>
        )}
        <span aria-hidden> / </span>
        <span>{account.name}</span>
      </nav>

      <header className="page-header account-page-header">
        {editingName ? (
          <div
            className={`title-row account-title-row name-heading account-title-row--${account.strategy.mode}`}
          >
            <span className="account-title-strategy-icon-wrap" aria-hidden>
              <StrategyTypeCardIcon mode={account.strategy.mode} />
            </span>
            <form
              className="inline-form title-edit"
              onSubmit={(e) => {
                e.preventDefault()
                renameAccount(accountId, nameDraft)
                setEditingName(false)
              }}
            >
              <input
                className="input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                aria-label="Account name"
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
          </div>
        ) : (
          <>
            <div
              className={`title-row account-title-row name-heading account-title-row--${account.strategy.mode}`}
            >
              <span className="account-title-strategy-icon-wrap" aria-hidden>
                <StrategyTypeCardIcon mode={account.strategy.mode} />
              </span>
              <div className="name-heading-label-group">
                <h1 className="name-heading-title">{account.name}</h1>
                <button
                  type="button"
                  className="name-edit-btn"
                  onClick={() => {
                    setNameDraft(account.name)
                    setEditingName(true)
                  }}
                  aria-label={`Edit account name (${account.name})`}
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
            </div>
            <p className="account-type-line">
              <span className="account-type-label">Growth type</span>
              <span className="account-type-value-edit-group">
                <span className="account-type-value">
                  {strategySummary(account.strategy)}
                </span>
                {account.strategy.mode === 'monthly_end_compound' ? (
                  <button
                    type="button"
                    className="btn link account-type-edit"
                    onClick={openStrategyModal}
                    aria-label="Edit month-end rates"
                  >
                    Edit rates
                  </button>
                ) : null}
              </span>
            </p>
          </>
        )}
        {kid && (
          <p className="account-type-line">
            <span className="account-type-label">Owner</span>
            <span className="account-type-value">{kid.name}</span>
          </p>
        )}
        <p className="account-type-line">
          <span className="account-type-label">Started</span>
          <span className="account-type-value">
            {formatRecordedDate(metrics.startDate)}
          </span>
        </p>
        {deposits.length === 0 && (
          <p className="muted small account-started-hint">
            Growth accrues from the first ledger date. Use{' '}
            <strong>Deposit</strong> under Deposits and withdrawals or add from{' '}
            {kid ? (
              <Link to={`/kids/${kid.id}`}>{kid.name}’s page</Link>
            ) : (
              'the child’s page'
            )}{' '}
            to start.
          </p>
        )}
        <div
          className="account-value-stats"
          role="group"
          aria-label="Account value breakdown"
        >
          <div className="account-stat account-stat-highlight">
            <span className="account-stat-label">Total account value</span>
            <span className="account-stat-value">
              {formatUsd(metrics.totalValueCents)}
            </span>
          </div>
          <div className="account-stat">
            <span className="account-stat-label">Deposits</span>
            <span className="account-stat-value">
              {formatUsd(metrics.totalDepositsInCents)}
            </span>
          </div>
          <div className="account-stat">
            <span className="account-stat-label">Withdrawals</span>
            <span className="account-stat-value">
              {formatUsd(-metrics.totalWithdrawalsCents)}
            </span>
          </div>
          <div className="account-stat">
            <span className="account-stat-label">Total growth</span>
            <span
              className={
                'account-stat-value' +
                (metrics.growthCents > 0
                  ? ' account-stat-value-growth-positive'
                  : metrics.growthCents < 0
                    ? ' account-stat-value-growth-negative'
                    : '')
              }
            >
              {formatUsd(metrics.growthCents)}
            </span>
          </div>
        </div>
      </header>

      {account.strategy.mode !== 'piggy_bank' ? (
        <AccountGrowthChart account={account} deposits={deposits} />
      ) : null}

      <section className="card deposit-section">
        <div className="deposit-section-head">
          <h2 className="card-title deposit-section-title">
            Deposits and withdrawals
          </h2>
          <div className="deposit-section-actions">
            <button
              type="button"
              className="btn primary btn-compact"
              onClick={() => openLedgerModal('deposit')}
            >
              Deposit
            </button>
            <button
              type="button"
              className="btn secondary btn-compact"
              onClick={() => openLedgerModal('withdrawal')}
            >
              Withdraw
            </button>
          </div>
        </div>
        <p className="muted small deposit-section-lede">
          Record money in or out. The table shows the most recent three months
          by default; use the actions below to load more or change the range.
          Optional notes help you remember the source (e.g. Tooth Fairy) or why
          cash left the account.
        </p>
        {deposits.length === 0 ? (
          <p className="muted">
            Nothing recorded yet — use <strong>Deposit</strong> or{' '}
            <strong>Withdraw</strong>, or add a deposit from{' '}
            {kid ? (
              <Link to={`/kids/${kid.id}`}>{kid.name}’s page</Link>
            ) : (
              'the child’s page'
            )}
            .
          </p>
        ) : (
          <AccountLedgerSection
            key={accountId}
            account={account}
            deposits={deposits}
            monthsDescending={ledgerMonthRange.monthsDescending}
            firstMonthKey={ledgerMonthRange.firstMonthKey}
            monthEndRatesEdit={
              account.strategy.mode === 'monthly_end_compound'
                ? {
                    rates: account.strategy.monthlyRatePercentByMonth,
                    onRatesChange: (next) => {
                      setStrategy(accountId, {
                        mode: 'monthly_end_compound',
                        monthlyRatePercentByMonth: next,
                      })
                    },
                  }
                : null
            }
            onEditDeposit={openLedgerModalForEdit}
            deleteDeposit={deleteDeposit}
          />
        )}
      </section>

      <dialog
        ref={strategyDialogRef}
        className="strategy-rule-modal"
        onClose={closeStrategyModal}
        aria-labelledby="strategy-modal-title"
      >
        {strategyDraft &&
          account.strategy.mode === 'monthly_end_compound' && (
          <div className="strategy-modal-box">
            <header className="strategy-modal-header">
              <h2 id="strategy-modal-title" className="strategy-modal-title">
                Month-end rates
              </h2>
              <button
                type="button"
                className="btn modal-close-btn"
                onClick={closeStrategyModal}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <div className="strategy-modal-body">
              <StrategyEditor
                typeLocked
                typeLockedLedgerMonths={ledgerMonthRange.monthsDescending}
                typeLockedFirstMonthKey={ledgerMonthRange.firstMonthKey}
                strategy={strategyDraft}
                onChange={handleStrategyDraftChange}
                showFieldsetLegend={false}
              />
            </div>
            <footer className="strategy-modal-footer">
              <button
                type="button"
                className="btn secondary"
                onClick={closeStrategyModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={saveStrategyFromModal}
              >
                Save rates
              </button>
            </footer>
          </div>
        )}
      </dialog>

      <dialog
        ref={depositDialogRef}
        className="strategy-rule-modal"
        onClose={closeLedgerModal}
        aria-labelledby="ledger-modal-title"
      >
        <form className="strategy-modal-box" onSubmit={submitLedgerEntry}>
          <header className="strategy-modal-header">
            <h2 id="ledger-modal-title" className="strategy-modal-title">
              {ledgerModalMode === 'edit'
                ? ledgerModalKind === 'withdrawal'
                  ? 'Edit withdrawal'
                  : 'Edit deposit'
                : ledgerModalKind === 'withdrawal'
                  ? 'Withdrawal'
                  : 'Deposit'}
            </h2>
            <button
              type="button"
              className="btn modal-close-btn"
              onClick={closeLedgerModal}
              aria-label="Close"
            >
              ×
            </button>
          </header>
          <div className="strategy-modal-body deposit-add-modal-body">
            <p className="muted small deposit-add-modal-lede">
              {ledgerModalMode === 'edit' ? (
                <>
                  Update this entry for <strong>{account.name}</strong>
                  {kid ? (
                    <>
                      {' '}
                      (<Link to={`/kids/${kid.id}`}>{kid.name}</Link>)
                    </>
                  ) : null}
                  . Changes apply from the transaction date onward.
                </>
              ) : (
                <>
                  {ledgerModalKind === 'withdrawal'
                    ? 'Money leaving '
                    : 'Money into '}
                  <strong>{account.name}</strong>
                  {kid ? (
                    <>
                      {' '}
                      (<Link to={`/kids/${kid.id}`}>{kid.name}</Link>)
                    </>
                  ) : null}
                  . Simulation uses this date going forward.
                </>
              )}
            </p>
            <fieldset className="ledger-modal-type-fieldset">
              <legend className="sr-only">Entry type</legend>
              <label className="radio-row ledger-modal-type-row">
                <input
                  type="radio"
                  name="ledger-kind"
                  checked={ledgerModalKind === 'deposit'}
                  onChange={() => setLedgerModalKind('deposit')}
                />
                <span>Deposit</span>
              </label>
              <label className="radio-row ledger-modal-type-row">
                <input
                  type="radio"
                  name="ledger-kind"
                  checked={ledgerModalKind === 'withdrawal'}
                  onChange={() => setLedgerModalKind('withdrawal')}
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
                  value={newLedgerDate}
                  onChange={(e) => setNewLedgerDate(e.target.value)}
                  required
                  aria-label="Transaction date"
                />
              </label>
              <label className="field deposit-add-modal-field deposit-add-modal-field-amount">
                <span className="label">Amount</span>
                <input
                  className="input deposit-add-modal-amount"
                  inputMode="decimal"
                  value={newLedgerAmount}
                  onChange={(e) => setNewLedgerAmount(e.target.value)}
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
                value={newLedgerNote}
                onChange={(e) => setNewLedgerNote(e.target.value)}
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
              onClick={closeLedgerModal}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary">
              {ledgerModalMode === 'edit'
                ? 'Save changes'
                : ledgerModalKind === 'withdrawal'
                  ? 'Withdraw'
                  : 'Deposit'}
            </button>
          </footer>
        </form>
      </dialog>
    </div>
  )
}

function DepositViewRow({
  record,
  onEdit,
  onDelete,
}: {
  record: DepositRecord
  onEdit: () => void
  onDelete: () => void
}) {
  const signed = signedLedgerAmountCents(record)
  return (
    <div className="deposit-row">
      <div className="deposit-row-main">
        <time className="deposit-date" dateTime={record.recordedAt}>
          {formatRecordedDate(record.recordedAt)}
        </time>
        <div
          className="deposit-note-cell muted small"
          title={record.note ?? undefined}
        >
          {record.note ? record.note : null}
        </div>
        <span
          className={
            'deposit-amount' +
            (record.kind === 'withdrawal'
              ? ' deposit-amount--withdrawal'
              : ' deposit-amount--deposit')
          }
        >
          {formatUsd(signed)}
        </span>
      </div>
      <div className="deposit-row-actions">
        <button type="button" className="deposit-row-action" onClick={onEdit}>
          Edit
        </button>
        <button
          type="button"
          className="deposit-row-action deposit-row-action--danger"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

