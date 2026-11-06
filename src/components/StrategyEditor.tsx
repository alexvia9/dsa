import { type KeyboardEvent, useState } from 'react'
import {
  GROWTH_MODEL_ONE_LINE,
  accountTypeForMode,
} from '../lib/accountTypeCatalog'
import { formatMonthYearLabel } from '../lib/formatMonthYm'
import {
  DEFAULT_MONTH_END_CAP_CENTS,
  monthEndStrategy,
} from '../lib/monthEndCap'
import { parseUsdToCents } from '../lib/money'
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
   * When true, the growth type cannot change. Name stays outside this editor.
   * Savings can change its annual rate, month-end can change percents and cap,
   * and piggy or market have no type switch.
   */
  typeLocked?: boolean
  /** With `typeLocked`, show the same per-month controls as the ledger table. */
  typeLockedLedgerMonths?: string[]
  typeLockedFirstMonthKey?: string
  /** Ledger months so month-end rates in Edit account match the activity table. */
  ledgerMonthsDescending?: string[]
  firstMonthKey?: string
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
  typeLocked = false,
  ledgerMonthsDescending,
  firstMonthKey,
}: Omit<Props, 'typeLockedLedgerMonths' | 'typeLockedFirstMonthKey'>) {
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
        onChange(
          strategy.mode === 'monthly_end_compound'
            ? monthEndStrategy(
                { ...strategy.monthlyRatePercentByMonth },
                strategy.capCents,
              )
            : monthEndStrategy({}, DEFAULT_MONTH_END_CAP_CENTS),
        )
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

  const lockedType = accountTypeForMode(strategy.mode)
  const fixedType = (
    <div className="strategy-type-fixed">
      <p className="label" id="strategy-type-fixed-label">
        Growth type
      </p>
      <p className="strategy-type-fixed-name">{lockedType.accountName}</p>
      <p className="hint strategy-type-fixed-lock">
        Set when this account was created. It cannot be changed.
      </p>
      <p className="muted small strategy-type-fixed-model">
        {GROWTH_MODEL_ONE_LINE[strategy.mode]}
      </p>
    </div>
  )

  return (
    <div
      className={
        'strategy-editor' +
        (accountTypePicker === 'cards' && !typeLocked
          ? ' strategy-editor--account-type-cards'
          : '') +
        (typeLocked ? ' strategy-editor-type-locked' : '')
      }
    >
      {typeLocked ? fixedType : typePicker}

      {typeLocked && strategy.mode === 'piggy_bank' && (
        <p className="hint">
          Growth stays at 0%. The balance only changes when you deposit or
          withdraw.
        </p>
      )}

      {typeLocked && strategy.mode === 'stock_market' && (
        <p className="hint">
          Growth follows the market illustration. There is no fixed percent to
          set.
        </p>
      )}

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
            Optional label for display (for example, &quot;College fund&quot;).
            Doesn&apos;t change how growth is calculated.
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
          layout={firstMonthKey ? 'accountEditModal' : 'default'}
          rates={strategy.monthlyRatePercentByMonth}
          capCents={strategy.capCents}
          onChange={(monthlyRatePercentByMonth) =>
            onChange(
              monthEndStrategy(monthlyRatePercentByMonth, strategy.capCents),
            )
          }
          onCapChange={(capCents) =>
            onChange(
              monthEndStrategy(strategy.monthlyRatePercentByMonth, capCents),
            )
          }
          accountModalLedgerMonthsDescending={ledgerMonthsDescending}
          accountModalFirstMonthKey={firstMonthKey}
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
  ledgerMonthsDescending,
  firstMonthKey,
}: Props) {
  return (
    <StrategyEditorFull
      strategy={strategy}
      onChange={onChange}
      showFieldsetLegend={showFieldsetLegend}
      accountTypePicker={accountTypePicker}
      typeLocked={typeLocked}
      ledgerMonthsDescending={
        ledgerMonthsDescending ?? typeLockedLedgerMonths
      }
      firstMonthKey={firstMonthKey ?? typeLockedFirstMonthKey}
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

function centsToDollarInput(cents: number): string {
  const dollars = cents / 100
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2)
}

function MonthEndCapField({
  capCents,
  onCapChange,
}: {
  capCents: number | undefined
  onCapChange: (capCents: number | undefined) => void
}) {
  const [text, setText] = useState(() =>
    capCents === undefined ? '' : centsToDollarInput(capCents),
  )
  const [focused, setFocused] = useState(false)
  const [seenCap, setSeenCap] = useState(capCents)

  if (!focused && capCents !== seenCap) {
    setSeenCap(capCents)
    setText(capCents === undefined ? '' : centsToDollarInput(capCents))
  }

  return (
    <label className="field month-end-cap-field">
      <span className="label">Learning cap ($)</span>
      <input
        type="text"
        inputMode="decimal"
        className="input"
        value={text}
        placeholder="No cap"
        aria-label="Learning cap in dollars"
        onChange={(e) => {
          const next = e.target.value
          setText(next)
          const trimmed = next.trim()
          if (trimmed === '') {
            onCapChange(undefined)
            return
          }
          const cents = parseUsdToCents(trimmed)
          if (cents != null) onCapChange(cents)
        }}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false)
          const trimmed = e.target.value.trim()
          if (trimmed === '') {
            onCapChange(undefined)
            setText('')
            return
          }
          const cents = parseUsdToCents(trimmed)
          if (cents == null) {
            setText(capCents === undefined ? '' : centsToDollarInput(capCents))
            return
          }
          onCapChange(cents)
          setText(centsToDollarInput(cents))
        }}
      />
      <span className="hint">
        Month-end growth applies only up to this balance. Leave blank for no
        cap. Money above the cap does not earn the month-end rate until it
        moves to an account that grows like savings or like the market.
      </span>
    </label>
  )
}

function MonthlyRatesEditor({
  rates,
  capCents,
  onChange,
  onCapChange,
  layout = 'default',
  accountModalLedgerMonthsDescending,
  accountModalFirstMonthKey,
}: {
  rates: Record<string, number>
  capCents: number | undefined
  onChange: (r: Record<string, number>) => void
  onCapChange: (capCents: number | undefined) => void
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
      <MonthEndCapField capCents={capCents} onCapChange={onCapChange} />
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
