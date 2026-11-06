import { formatUsd, formatUsdSigned } from '../lib/money'

export type PerformanceReadoutItem = {
  label: string
  cents: number
  /** Prefix a plus on gains. Use for Grew and In or out. */
  signed?: boolean
}

type Props = {
  ariaLabel: string
  items: PerformanceReadoutItem[]
  /** Uses the same words as the labels, so the numbers can be checked. */
  formula: string
  note?: string
}

export function PerformanceReadout({ ariaLabel, items, formula, note }: Props) {
  return (
    <div className="performance-readout" role="group" aria-label={ariaLabel}>
      <div className="performance-readout-metrics">
        {items.map((item) => {
          const direction =
            item.signed && item.cents > 0
              ? 'up'
              : item.signed && item.cents < 0
                ? 'down'
                : ''
          return (
            <div key={item.label} className="performance-readout-metric">
              <span className="performance-readout-label">{item.label}</span>
              <span
                className={
                  direction
                    ? `performance-readout-value performance-readout-value--${direction}`
                    : 'performance-readout-value'
                }
              >
                {item.signed ? formatUsdSigned(item.cents) : formatUsd(item.cents)}
              </span>
            </div>
          )
        })}
      </div>
      <p className="performance-readout-formula">{formula}</p>
      {note ? <p className="performance-readout-note">{note}</p> : null}
    </div>
  )
}
