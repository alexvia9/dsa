import { type KeyboardEvent, useRef, useState } from 'react'
import { effectiveMonthEndPercentForMonth } from '../lib/accountGrowth'
import { formatMonthYearLabel } from '../lib/formatMonthYm'

function formatPctReadout(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (Number.isInteger(n)) return String(n)
  const s = n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
  return s
}

function PenEditIcon() {
  return (
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
  )
}

/** One month’s month-end % field (ledger table row or list item). */
export function LedgerMonthEndGrowthField({
  ym,
  firstMonthKey,
  rates,
  onRatesChange,
  variant = 'default',
}: {
  ym: string
  firstMonthKey: string
  rates: Record<string, number>
  onRatesChange: (next: Record<string, number>) => void
  /** `monthHeader`: ledger title row. `tableCell`: % only, month in sibling column. */
  variant?: 'default' | 'monthHeader' | 'tableCell'
}) {
  return (
    <MonthEndGrowthRow
      ym={ym}
      monthLabel={formatMonthYearLabel(ym)}
      firstMonthKey={firstMonthKey}
      rates={rates}
      onRatesChange={onRatesChange}
      variant={variant}
    />
  )
}

function MonthEndGrowthRow({
  ym,
  monthLabel,
  firstMonthKey,
  rates,
  onRatesChange,
  variant = 'default',
}: {
  ym: string
  monthLabel: string
  firstMonthKey: string
  rates: Record<string, number>
  onRatesChange: (next: Record<string, number>) => void
  variant?: 'default' | 'monthHeader' | 'tableCell'
}) {
  const effective = effectiveMonthEndPercentForMonth(rates, ym, firstMonthKey)
  const hasExplicit = Object.hasOwn(rates, ym)
  const explicitVal = hasExplicit ? rates[ym] : undefined
  const canonicalDisplay =
    hasExplicit && explicitVal !== undefined ? String(explicitVal) : ''
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState('')
  const [headerEditing, setHeaderEditing] = useState(false)
  const [headerDraft, setHeaderDraft] = useState('')
  const skipHeaderBlurCommit = useRef(false)

  const displayValue = focused ? draft : canonicalDisplay

  const commitFromString = (raw: string) => {
    const t = raw.trim()
    if (t === '') {
      if (hasExplicit) {
        const next = { ...rates }
        delete next[ym]
        onRatesChange(next)
      }
      return
    }
    const p = Number.parseFloat(t.replace(/,/g, ''))
    if (!Number.isFinite(p) || p < 0) return
    onRatesChange({ ...rates, [ym]: p })
  }

  const onKeyDownDefault = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    e.currentTarget.blur()
  }

  const onKeyDownHeaderEdit = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      skipHeaderBlurCommit.current = true
      setHeaderEditing(false)
      return
    }
    if (e.key !== 'Enter') return
    e.preventDefault()
    e.currentTarget.blur()
  }

  const headerMode = variant === 'monthHeader'

  if (headerMode && headerEditing) {
    const finishHeaderEdit = () => {
      if (skipHeaderBlurCommit.current) {
        skipHeaderBlurCommit.current = false
        return
      }
      commitFromString(headerDraft)
      setHeaderEditing(false)
    }
    return (
      <div className="inline-form month-growth-header-edit name-heading">
        <label className="month-growth-header-edit-label">
          <span className="label">Growth</span>
          <span className="month-growth-header-edit-inner">
            <input
              type="text"
              inputMode="decimal"
              className="input month-growth-header-edit-input"
              value={headerDraft}
              onChange={(e) => setHeaderDraft(e.target.value)}
              autoFocus
              placeholder={String(effective)}
              onBlur={finishHeaderEdit}
              onKeyDown={onKeyDownHeaderEdit}
              aria-label={`Month-end growth percent for ${monthLabel}`}
            />
            <span className="suffix month-growth-header-edit-suffix">%</span>
          </span>
        </label>
      </div>
    )
  }

  if (variant === 'tableCell') {
    return (
      <div className="month-end-growth-row month-end-growth-row--table-cell">
        <div className="month-end-growth-row-field">
          <label className="month-end-growth-input-wrap">
            <span className="label sr-only">
              Month-end growth % for {monthLabel}
            </span>
            <input
              type="text"
              inputMode="decimal"
              className="input month-end-growth-input month-end-growth-input--table"
              value={displayValue}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => {
                setFocused(true)
                setDraft(canonicalDisplay)
              }}
              onBlur={(e) => {
                setFocused(false)
                commitFromString(e.target.value)
              }}
              onKeyDown={onKeyDownDefault}
              placeholder={String(effective)}
              aria-label={`Month-end growth percent for ${monthLabel}`}
            />
            <span className="suffix month-end-growth-suffix">%</span>
          </label>
          {!hasExplicit ? (
            <span className="muted small month-end-growth-inherited">
              Inherited {formatPctReadout(effective)}% from last month
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  if (headerMode) {
    return (
      <div className="title-row month-growth-header-static name-heading">
        <p className="month-growth-header-readout">
          <span className="month-growth-header-readout-label">Growth</span>
          <span className="month-growth-header-readout-value">
            {formatPctReadout(effective)}%
          </span>
        </p>
        <button
          type="button"
          className="name-edit-btn"
          onClick={() => {
            setHeaderDraft(canonicalDisplay)
            setHeaderEditing(true)
          }}
          aria-label={`Edit month-end growth for ${monthLabel}`}
        >
          <PenEditIcon />
        </button>
      </div>
    )
  }

  return (
    <div className="month-end-growth-row">
      <span className="month-end-growth-row-label">{monthLabel}</span>
      <div className="month-end-growth-row-field">
        <label className="month-end-growth-input-wrap">
          <span className="label sr-only">
            Month-end growth % for {monthLabel}
          </span>
          <input
            type="text"
            inputMode="decimal"
            className="input month-end-growth-input narrow"
            value={displayValue}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => {
              setFocused(true)
              setDraft(canonicalDisplay)
            }}
            onBlur={(e) => {
              setFocused(false)
              commitFromString(e.target.value)
            }}
            onKeyDown={onKeyDownDefault}
            placeholder={String(effective)}
            aria-label={`Month-end growth percent for ${monthLabel}`}
          />
          <span className="suffix month-end-growth-suffix">%</span>
        </label>
        {!hasExplicit ? (
          <span className="muted small month-end-growth-inherited">
            Inherited {formatPctReadout(effective)}% from last month
          </span>
        ) : null}
      </div>
    </div>
  )
}

type Props = {
  monthsDescending: string[]
  firstMonthKey: string
  rates: Record<string, number>
  onRatesChange: (next: Record<string, number>) => void
  /** e.g. "Ledger months" vs "Same months as the table below" */
  heading?: string
  className?: string
  /**
   * When true, only the table (no section title or lede) — for use inside the
   * edit-rates modal below the add toolbar.
   */
  embedded?: boolean
}

export function MonthEndRatesByLedgerMonth({
  monthsDescending,
  firstMonthKey,
  rates,
  onRatesChange,
  heading = 'Growth % at each month-end',
  className = '',
  embedded = false,
}: Props) {
  if (monthsDescending.length === 0) return null

  const table = (
    <div className="month-rates-table-wrap">
      <table className="month-rates-table month-rates-table--ledger">
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Rate (%)</th>
            <th scope="col" className="month-rates-col-actions">
              <span className="sr-only">Remove</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {monthsDescending.map((ym) => {
            const hasExplicit = Object.hasOwn(rates, ym)
            return (
              <tr key={ym}>
                <td className="month-rates-td-month">
                  {formatMonthYearLabel(ym)}
                </td>
                <td className="month-rates-td-pct">
                  <LedgerMonthEndGrowthField
                    variant="tableCell"
                    ym={ym}
                    firstMonthKey={firstMonthKey}
                    rates={rates}
                    onRatesChange={onRatesChange}
                  />
                </td>
                <td className="month-rates-td-actions">
                  <button
                    type="button"
                    className="btn link month-rates-remove"
                    disabled={!hasExplicit}
                    title={
                      hasExplicit
                        ? 'Clear this month’s rate (use inherited %)'
                        : 'No saved rate for this month'
                    }
                    onClick={() => {
                      if (!hasExplicit) return
                      const next = { ...rates }
                      delete next[ym]
                      onRatesChange(next)
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  if (embedded) {
    return table
  }

  return (
    <div className={`month-end-ledger-rates ${className}`.trim()}>
      <h3 className="month-end-ledger-rates-heading">{heading}</h3>
      <p className="muted small month-end-ledger-rates-lede">
        Enter a % to set that month; leave blank and blur to clear and use the
        inherited rate (from earlier months or 0%). Remove clears a saved rate
        so this month inherits again.
      </p>
      {table}
    </div>
  )
}
