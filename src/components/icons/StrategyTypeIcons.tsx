import type { JSX } from 'react'
import type { InvestmentStrategy } from '../../types/dsa'

type StrategyMode = InvestmentStrategy['mode']

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/**
 * Piggy bank — front-facing pig: chubby head, big floppy ears, wide snout,
 * bold eyes (optimized for 24px stroke icons).
 */
function IconPig() {
  return (
    <svg {...svgProps} aria-hidden>
      <ellipse cx="12" cy="12.85" rx="7.5" ry="6.65" />
      <path d="M5.35 10.5Q4.25 5.75 7.6 4.85Q10.15 4.2 10.35 8.65" />
      <path d="M18.65 10.5Q19.75 5.75 16.4 4.85Q13.85 4.2 13.65 8.65" />
      <ellipse cx="12" cy="17.05" rx="4.35" ry="2.9" />
      <circle cx="8.35" cy="11.4" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.65" cy="11.4" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="10.15" cy="17.05" r="0.52" fill="currentColor" stroke="none" />
      <circle cx="13.85" cy="17.05" r="0.52" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Standard savings (APY) — leaf: steady, organic growth (fits slow, smooth
 * savings / APY teaching).
 */
function IconLeafGrowth() {
  return (
    <svg {...svgProps} aria-hidden>
      <path d="M12 22V13" />
      <path d="M12 4C8 7 5 11 5 15c0 3.5 2.5 6 7 7 4.5-1 7-3.5 7-7 0-4-3-8-7-11z" />
    </svg>
  )
}

/** Month-end compound — calendar grid (growth is tied to each month-end). */
function IconCalendarMonth() {
  return (
    <svg {...svgProps} aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
      <circle cx="8" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8" cy="18" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Market index — trending line (markets move around, long-run “zoom out”
 * framing).
 */
function IconMarketChart() {
  return (
    <svg {...svgProps} aria-hidden>
      <path d="M3 21h18" />
      <polyline points="4 17 8 12 12 14.5 16 7 20 10" />
    </svg>
  )
}

const ICON_BY_MODE: Record<StrategyMode, () => JSX.Element> = {
  piggy_bank: IconPig,
  savings_apr: IconLeafGrowth,
  monthly_end_compound: IconCalendarMonth,
  stock_market: IconMarketChart,
}

export function StrategyTypeCardIcon({ mode }: { mode: StrategyMode }) {
  const Icon = ICON_BY_MODE[mode]
  return <Icon />
}
