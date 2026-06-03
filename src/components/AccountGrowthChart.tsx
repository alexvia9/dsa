import { useId, useMemo, useState } from 'react'
import type { Account, DepositRecord } from '../types/dsa'
import {
  type GrowthChartPoint,
  type GrowthChartRange,
  buildGrowthChartSeries,
  growthChartWindowBreakdown,
} from '../lib/accountGrowthHistory'
import { localDateString } from '../lib/dateLocal'
import { formatUsd } from '../lib/money'
import { strategyGrowthBasisLine } from '../lib/strategyLabel'
import { PerformanceAiInsight } from './PerformanceAiInsight'

const PRESETS: { id: GrowthChartRange; label: string }[] = [
  { id: '1m', label: '1m' },
  { id: '3m', label: '3m' },
  { id: '1y', label: '1y' },
]

const RANGE_HEADING: Record<GrowthChartRange, string> = {
  '1m': 'Past month',
  '3m': 'Past 3 months',
  '1y': 'Past year',
}

type Props = {
  account: Account
  deposits: DepositRecord[]
}

const CHART_W = 640
const CHART_H = 220
const PAD_L = 8
const PAD_R = 12
const PAD_T = 12
const PAD_B = 28

function formatAxisDate(ymd: string): string {
  const parts = ymd.split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return ymd
  const [y, m, d] = parts
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(y, m - 1, d))
}

function formatChartWindowRange(fromYmd: string, toYmd: string): string {
  const parse = (s: string) => {
    const p = s.split('-').map(Number)
    if (p.length !== 3 || p.some((n) => !Number.isFinite(n))) return null
    const [y, mo, d] = p
    return new Date(y, mo - 1, d)
  }
  const a = parse(fromYmd)
  const b = parse(toYmd)
  if (!a || !b) return `${fromYmd} – ${toYmd}`
  const fmt = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${fmt.format(a)} – ${fmt.format(b)}`
}

function formatUsdGrowthSigned(cents: number): string {
  const t = formatUsd(cents)
  return cents > 0 ? `+${t}` : t
}

export function AccountGrowthChart({ account, deposits }: Props) {
  const [range, setRange] = useState<GrowthChartRange>('3m')
  const todayYmd = localDateString()
  const gradId = useId()

  const series = useMemo(
    () => buildGrowthChartSeries(account, deposits, range, todayYmd),
    [account, deposits, range, todayYmd],
  )

  const windowBreakdown = useMemo(
    () => growthChartWindowBreakdown(account, deposits, range, todayYmd),
    [account, deposits, range, todayYmd],
  )

  const basisLine = strategyGrowthBasisLine(account.strategy)
  const windowRangeLabel = formatChartWindowRange(
    windowBreakdown.windowFromYmd,
    windowBreakdown.windowToYmd,
  )

  const { pathD, areaD, minV, maxV, ticks } = useMemo(() => {
    if (series.length === 0) {
      return {
        pathD: '',
        areaD: '',
        minV: 0,
        maxV: 0,
        ticks: [] as { x: number; label: string }[],
      }
    }

    const values = series.map((p) => p.valueCents)
    let minV = Math.min(...values)
    let maxV = Math.max(...values)
    if (minV === maxV) {
      minV = Math.max(0, minV - 1)
      maxV = maxV + 1
    }
    const span = maxV - minV
    const innerW = CHART_W - PAD_L - PAD_R
    const innerH = CHART_H - PAD_T - PAD_B
    const n = series.length
    const xAt = (i: number) =>
      PAD_L + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1))
    const yAt = (v: number) =>
      PAD_T + innerH - ((v - minV) / span) * innerH

    const points = series.map((p, i) => ({
      x: xAt(i),
      y: yAt(p.valueCents),
    }))

    const pathD = points
      .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
      .join(' ')

    const areaD = `${pathD} L ${points[points.length - 1]!.x.toFixed(2)} ${(PAD_T + innerH).toFixed(2)} L ${points[0]!.x.toFixed(2)} ${(PAD_T + innerH).toFixed(2)} Z`

    const tickIdx =
      n <= 2
        ? [0, n - 1]
        : n <= 8
          ? [0, Math.floor((n - 1) / 2), n - 1]
          : [0, Math.floor((n - 1) / 3), Math.floor((2 * (n - 1)) / 3), n - 1]

    const ticks = [...new Set(tickIdx)]
      .filter((i) => i >= 0 && i < n)
      .map((i) => ({
        x: xAt(i),
        label: formatAxisDate(series[i]!.date),
      }))

    return { pathD, areaD, minV, maxV, ticks }
  }, [series])

  const modeClass = `account-growth-chart-card--${account.strategy.mode}`

  return (
    <section
      className={`account-fidelity-panel account-growth-chart-card ${modeClass}`}
    >
      <div className="account-growth-chart-head account-fidelity-panel-head">
        <h2 className="account-fidelity-panel-title account-growth-chart-title">
          Performance
        </h2>
        <div
          className="account-growth-range-toggle account-fidelity-range-toggle"
          role="group"
          aria-label="Chart time range"
        >
          {PRESETS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={
                range === id
                  ? 'account-fidelity-range-btn is-active'
                  : 'account-fidelity-range-btn'
              }
              onClick={() => setRange(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="account-growth-chart-caption account-fidelity-panel-lede">
        End-of-day balance for each date. The range is a full month, three months,
        or one year ending <strong>today</strong>. Days before your first ledger
        entry show <strong>$0</strong>.
      </p>
      <div
        className="account-growth-chart-window-summary"
        role="region"
        aria-label={`Growth for ${RANGE_HEADING[range]}`}
      >
        <p className="account-growth-chart-window-heading">
          <strong>{RANGE_HEADING[range]}</strong>
          <span className="account-growth-chart-window-dates">
            {' '}
            ({windowRangeLabel})
          </span>
        </p>
        <p className="account-growth-chart-window-metric">
          <span className="account-growth-chart-window-metric-label">
            Growth from account rules in this window
          </span>{' '}
          <strong
            className={
              windowBreakdown.growthInWindowCents > 0
                ? 'account-stat-value-growth-positive'
                : windowBreakdown.growthInWindowCents < 0
                  ? 'account-stat-value-growth-negative'
                  : ''
            }
          >
            {formatUsdGrowthSigned(windowBreakdown.growthInWindowCents)}
          </strong>
          <span className="muted account-growth-chart-window-metric-hint">
            {' '}
            — change not explained by deposits or withdrawals dated in this range.
          </span>
        </p>
        <p className="muted small account-growth-chart-window-flows">
          Net deposits and withdrawals in this window:{' '}
          <strong className="account-growth-chart-window-flows-value">
            {formatUsdGrowthSigned(windowBreakdown.netFlowInWindowCents)}
          </strong>
        </p>
        <p className="muted small account-growth-chart-window-basis">
          <strong>Based on:</strong> {basisLine}
        </p>
      </div>
      <PerformanceAiInsight
        account={account}
        deposits={deposits}
        range={range}
        windowFromYmd={windowBreakdown.windowFromYmd}
        windowToYmd={windowBreakdown.windowToYmd}
        growthInWindowCents={windowBreakdown.growthInWindowCents}
        netFlowInWindowCents={windowBreakdown.netFlowInWindowCents}
      />
      <div className="account-growth-chart-svg-wrap">
        <svg
          className="account-growth-chart-svg"
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="account-growth-gradient-stop-0" />
              <stop offset="100%" className="account-growth-gradient-stop-1" />
            </linearGradient>
          </defs>
          {areaD ? (
            <path d={areaD} fill={`url(#${gradId})`} className="account-growth-area" />
          ) : null}
          {pathD ? (
            <path
              d={pathD}
              fill="none"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="account-growth-line"
            />
          ) : null}
          {ticks.map((t, ti) => (
            <text
              key={`${t.label}-${t.x}-${ti}`}
              x={t.x}
              y={CHART_H - 6}
              textAnchor="middle"
              className="account-growth-tick-label"
            >
              {t.label}
            </text>
          ))}
        </svg>
      </div>
      <div className="account-growth-chart-legend muted small">
        <span>
          Low: <strong>{formatUsd(minV)}</strong>
        </span>
        <span>
          High: <strong>{formatUsd(maxV)}</strong>
        </span>
      </div>
      <GrowthChartScreenReaderTable
        series={series}
        rangeHeading={RANGE_HEADING[range]}
        windowRangeLabel={windowRangeLabel}
        growthInWindowCents={windowBreakdown.growthInWindowCents}
        netFlowInWindowCents={windowBreakdown.netFlowInWindowCents}
        basisLine={basisLine}
      />
    </section>
  )
}

function GrowthChartScreenReaderTable({
  series,
  rangeHeading,
  windowRangeLabel,
  growthInWindowCents,
  netFlowInWindowCents,
  basisLine,
}: {
  series: GrowthChartPoint[]
  rangeHeading: string
  windowRangeLabel: string
  growthInWindowCents: number
  netFlowInWindowCents: number
  basisLine: string
}) {
  const stride =
    series.length <= 12 ? 1 : Math.max(1, Math.floor(series.length / 12))
  const rows: GrowthChartPoint[] = []
  for (let i = 0; i < series.length; i += stride) {
    rows.push(series[i]!)
  }
  const last = series[series.length - 1]!
  if (rows[rows.length - 1]?.date !== last.date) rows.push(last)
  return (
    <div className="sr-only">
      <p>
        {rangeHeading}, {windowRangeLabel}. Growth from account rules in this
        window: {formatUsdGrowthSigned(growthInWindowCents)}. Net deposits and
        withdrawals in window: {formatUsdGrowthSigned(netFlowInWindowCents)}.
        Based on: {basisLine}
      </p>
      <table>
        <caption>Account value by date</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{formatUsd(p.valueCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
