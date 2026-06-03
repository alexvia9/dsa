import { type KeyboardEvent, useState } from 'react'
import {
  GROWTH_MODEL_ONE_LINE,
  accountTypeForMode,
} from '../lib/accountTypeCatalog'
import { formatMonthYearLabel } from '../lib/formatMonthYm'
import { StrategyTypeCardIcon } from './icons/StrategyTypeIcons'
import { MonthEndRatesByLedgerMonth } from './MonthEndRatesByLedgerMonth'
import type { InvestmentStrategy } from '../types/dsa'

type Props = {
  strategy: InvestmentStrategy
  onChange: (s: InvestmentStrategy) => void
  /** Hide visible legend when a parent already titles this block */
  showFieldsetLegend?: boolean
  /**
   * `cards`: large tappable cards (e.g. new-account modal). Default: compact radio list.
   */
  accountTypePicker?: 'list' | 'cards'
  /**
   * When true, the growth type cannot change. Only month-end % rows are
   * editable (and only when the strategy is `monthly_end_compound`).
   */
  typeLocked?: boolean
  /** With `typeLocked`, show the same per-month controls as the ledger table. */
  typeLockedLedgerMonths?: string[]
  typeLockedFirstMonthKey?: string
}

const ACCOUNT_TYPE_MODES = [
  'piggy_bank',
  'savings_apr',
  'monthly_end_compound',
  'stock_market',
] as const satisfies readonly InvestmentStrategy['mode'][]

function StrategyEditorFull({
  strategy,
  onChange,
  showFieldsetLegend = true,
  accountTypePicker = 'list',
}: Omit<Props, 'typeLocked'>) {
  const selectMode = (m: (typeof ACCOUNT_TYPE_MODES)[number]) => {
    switch (m) {
      case 'piggy_bank':
        onChange({ mode: 'piggy_bank' })
        break
      case 'savings_apr':
        onChange({
          mode: 'savings_apr',
          annualRatePercent:
            strategy.mode === 'savings_apr' ? strategy.annualRatePercent : 3,
        })
        break
      case 'monthly_end_compound':
        onChange({
          mode: 'monthly_end_compound',
          monthlyRatePercentByMonth:
            strategy.mode === 'monthly_end_compound'
              ? { ...strategy.monthlyRatePercentByMonth }
              : {},
        })
        break
      case 'stock_market':
        onChange({
          mode: 'stock_market',
          benchmarkSymbol:
            strategy.mode === 'stock_market' ? strategy.benchmarkSymbol : '',
        })
        break
    }
  }

  const typePicker =
    accountTypePicker === 'cards' ? (
      <fieldset className="field-group strategy-type-card-fieldset">
        <legend className="sr-only">Account type</legend>
        <div className="strategy-type-card-grid">
          {ACCOUNT_TYPE_MODES.map((m) => {
            const catalog = accountTypeForMode(m)
            const selected = strategy.mode === m
            return (
              <label
                key={m}
                className={
                  'strategy-type-card strategy-type-card--' +
                  m +
                  (selected ? ' strategy-type-card--selected' : '')
                }
              >
                <input
                  type="radio"
                  name="account-type"
                  className="sr-only strategy-type-card-radio"
                  checked={selected}
                  onChange={() => selectMode(m)}
                />
                <span className="strategy-type-card-check" aria-hidden="true">
                  ✓
                </span>
                <div className="strategy-type-card-top">
                  <span className="strategy-type-card-icon-wrap" aria-hidden>
                    <StrategyTypeCardIcon mode={m} />
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
                <span className="strategy-type-card-desc">
                  {GROWTH_MODEL_ONE_LINE[m]}
                </span>
                <span className="strategy-type-card-teach">
                  {catalog.teachingContext}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>
    ) : (
      <fieldset className="field-group">
        <legend className={showFieldsetLegend ? '' : 'sr-only'}>
          Account type
        </legend>
        {ACCOUNT_TYPE_MODES.map((m) => {
          const catalog = accountTypeForMode(m)
          return (
            <label key={m} className="radio-row">
              <input
                type="radio"
                name="account-type"
                checked={strategy.mode === m}
                onChange={() => selectMode(m)}
              />
              <span className="strategy-account-type-compact">
                <span className="strategy-account-type-compact-title">
                  {catalog.accountName}
                </span>
                <span className="strategy-account-type-compact-model muted small">
                  {GROWTH_MODEL_ONE_LINE[m]}
                </span>
                <span className="strategy-account-type-compact-teaching muted small">
                  {catalog.teachingContext}
                </span>
              </span>
            </label>
          )
        })}
      </fieldset>
    )

  return (
    <div
      className={
        'strategy-editor' +
        (accountTypePicker === 'cards'
          ? ' strategy-editor--account-type-cards'
          : '')
      }
    >
      {typePicker}

      {strategy.mode === 'stock_market' && (
        <label className="field">
          <span className="label">Optional label</span>
          <input
            type="text"
            className="input"
            value={strategy.benchmarkSymbol}
            onChange={(e) =>
              onChange({
                mode: 'stock_market',
                benchmarkSymbol: e.target.value.toUpperCase().slice(0, 8),
              })
            }
            placeholder="e.g. My index"
            maxLength={8}
          />
          <span className="hint">
            For display only. Growth follows SPY/S&amp;P 500 daily returns from
            bundled data (<code>src/data/sp500-daily-returns.json</code>, kept in
            sync with <code>public/market/</code> by{' '}
            <code>npm run update-sp500</code> or the repo’s daily GitHub Action).
          </span>
        </label>
      )}

      {strategy.mode === 'savings_apr' && (
        <label className="field">
          <span className="label">Annual rate (%)</span>
          <input
            type="number"
            className="input"
            min={0}
            step={0.01}
            value={strategy.annualRatePercent}
            onChange={(e) =>
              onChange({
                mode: 'savings_apr',
                annualRatePercent: Number.parseFloat(e.target.value) || 0,
              })
            }
          />
        </label>
      )}

      {strategy.mode === 'monthly_end_compound' && (
        <MonthlyRatesEditor
          rates={strategy.monthlyRatePercentByMonth}
          onChange={(monthlyRatePercentByMonth) =>
            onChange({ mode: 'monthly_end_compound', monthlyRatePercentByMonth })
          }
        />
      )}
    </div>
  )
}

export function StrategyEditor({
  strategy,
  onChange,
  showFieldsetLegend = true,
  accountTypePicker = 'list',
  typeLocked = false,
  typeLockedLedgerMonths,
  typeLockedFirstMonthKey,
}: Props) {
  if (typeLocked) {
    if (strategy.mode !== 'monthly_end_compound') return null
    const monthEndType = accountTypeForMode('monthly_end_compound')

    return (
      <div className="strategy-editor strategy-editor-type-locked">
        <p className="muted small strategy-type-locked-lede">
          Growth type: {monthEndType.accountName} (
          {monthEndType.technicalLabel}). You can add or change the percentage
          for each month-end.
        </p>
        <MonthlyRatesEditor
          layout="accountEditModal"
          rates={strategy.monthlyRatePercentByMonth}
          onChange={(monthlyRatePercentByMonth) =>
            onChange({ mode: 'monthly_end_compound', monthlyRatePercentByMonth })
          }
          accountModalLedgerMonthsDescending={typeLockedLedgerMonths ?? []}
          accountModalFirstMonthKey={
            typeLockedFirstMonthKey ?? monthKeyNow()
          }
        />
      </div>
    )
  }
  return (
    <StrategyEditorFull
      strategy={strategy}
      onChange={onChange}
      showFieldsetLegend={showFieldsetLegend}
      accountTypePicker={accountTypePicker}
    />
  )
}

function monthKeyNow(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Ledger months plus any YYYY-MM keys in rates, newest first. */
function unifiedAccountModalMonthsDescending(
  ledgerMonthsDescending: string[],
  rates: Record<string, number>,
): string[] {
  const set = new Set<string>()
  for (const ym of ledgerMonthsDescending) set.add(ym)
  for (const k of Object.keys(rates)) set.add(k)
  return [...set].sort((a, b) => b.localeCompare(a))
}

function commitMonthPercent(
  rates: Record<string, number>,
  monthKey: string,
  raw: string,
): Record<string, number> {
  const t = raw.trim()
  if (t === '') {
    const next = { ...rates }
    delete next[monthKey]
    return next
  }
  const p = Number.parseFloat(t.replace(/,/g, ''))
  if (!Number.isFinite(p) || p < 0) return rates
  return { ...rates, [monthKey]: p }
}

function EditableTableRateCell({
  monthKey,
  percent,
  onCommit,
}: {
  monthKey: string
  percent: number
  onCommit: (raw: string) => void
}) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState(String(percent))
  const display = focused ? draft : String(percent)

  return (
    <span className="month-rates-table-pct-wrap">
      <input
        type="text"
        inputMode="decimal"
        className="input month-rates-table-pct-input"
        value={display}
        onChange={(e) => setDraft(e.target.value)}
        onFocus={() => {
          setFocused(true)
          setDraft(String(percent))
        }}
        onBlur={(e) => {
          setFocused(false)
          onCommit(e.target.value)
        }}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key !== 'Enter') return
          e.preventDefault()
          e.currentTarget.blur()
        }}
        aria-label={`Rate percent for ${formatMonthYearLabel(monthKey)}`}
      />
      <span className="suffix">%</span>
    </span>
  )
}

function MonthlyRatesEditor({
  rates,
  onChange,
  layout = 'default',
  accountModalLedgerMonthsDescending,
  accountModalFirstMonthKey,
}: {
  rates: Record<string, number>
  onChange: (r: Record<string, number>) => void
  layout?: 'default' | 'accountEditModal'
  /** With `layout="accountEditModal"`, ledger months merged into one table with rate keys. */
  accountModalLedgerMonthsDescending?: string[]
  accountModalFirstMonthKey?: string
}) {
  const rows = Object.entries(rates).sort(([a], [b]) => a.localeCompare(b))
  const [pickerMonth, setPickerMonth] = useState(() => monthKeyNow())
  const [draftPct, setDraftPct] = useState('1')
  const [addHint, setAddHint] = useState<string | null>(null)
  const isAccountEditModal = layout === 'accountEditModal'
  const unifiedAccountModal =
    isAccountEditModal && accountModalFirstMonthKey !== undefined
  const unifiedMonthsDescending = unifiedAccountModal
    ? unifiedAccountModalMonthsDescending(
        accountModalLedgerMonthsDescending ?? [],
        rates,
      )
    : []

  const addRow = () => {
    setAddHint(null)
    if (!/^\d{4}-\d{2}$/.test(pickerMonth)) {
      setAddHint('Pick a month.')
      return
    }
    const pct = Number.parseFloat(draftPct)
    if (!Number.isFinite(pct) || pct < 0) {
      setAddHint('Enter a valid percent (0 or greater).')
      return
    }
    onChange({ ...rates, [pickerMonth]: pct })
  }

  const remove = (key: string) => {
    const next = { ...rates }
    delete next[key]
    onChange(next)
  }

  return (
    <div
      className={
        'monthly-rates' +
        (isAccountEditModal ? ' monthly-rates--account-edit-modal' : '')
      }
    >
      <p className="hint monthly-rates-hint">
        {isAccountEditModal
          ? 'Choose a month, enter a rate, and add it. Edit % in the table; Remove clears that month’s saved rate so it inherits from an earlier month (or 0%).'
          : 'Choose a month, enter a rate, and add it. Edit % in the table; remove a row to clear that month.'}
      </p>
      <div className="month-rates-toolbar">
        <label className="month-rates-tool-field">
          <span className="label">Month</span>
          <input
            type="month"
            className="input month-rates-month-only"
            value={pickerMonth}
            onChange={(e) => {
              const v = e.target.value
              if (v) setPickerMonth(v)
            }}
            aria-label="Month to add or update"
          />
        </label>
        <label className="month-rates-tool-field">
          <span className="label">Rate (%)</span>
          <span className="month-rates-pct-inline">
            <input
              type="text"
              className="input month-rates-toolbar-pct"
              inputMode="decimal"
              value={draftPct}
              onChange={(e) => setDraftPct(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                addRow()
              }}
              aria-label="Percent for selected month"
            />
            <span className="suffix">%</span>
          </span>
        </label>
        <button
          type="button"
          className="btn secondary month-rates-toolbar-add"
          onClick={addRow}
        >
          Add
        </button>
      </div>
      {addHint ? (
        <p className="month-add-hint" role="status">
          {addHint}
        </p>
      ) : null}
      {unifiedAccountModal ? (
        <div className="month-rates-ledger-below-toolbar">
          {unifiedMonthsDescending.length === 0 ? (
            <p className="muted month-rates-table-empty">No months yet.</p>
          ) : (
            <MonthEndRatesByLedgerMonth
              embedded
              monthsDescending={unifiedMonthsDescending}
              firstMonthKey={accountModalFirstMonthKey!}
              rates={rates}
              onRatesChange={onChange}
            />
          )}
        </div>
      ) : (
        <div className="month-rates-table-wrap">
          {rows.length === 0 ? (
            <p className="muted month-rates-table-empty">
              No months added yet.
            </p>
          ) : (
            <table className="month-rates-table">
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
                {rows.map(([month, pct]) => (
                  <tr key={month}>
                    <td className="month-rates-td-month">
                      {formatMonthYearLabel(month)}
                    </td>
                    <td className="month-rates-td-pct">
                      <EditableTableRateCell
                        monthKey={month}
                        percent={pct}
                        onCommit={(raw) => {
                          const next = commitMonthPercent(rates, month, raw)
                          if (next !== rates) onChange(next)
                        }}
                      />
                    </td>
                    <td className="month-rates-td-actions">
                      <button
                        type="button"
                        className="btn link month-rates-remove"
                        onClick={() => remove(month)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
