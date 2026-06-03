type Props = {
  text: string
  /** Accessible name for the trigger (defaults to text). */
  ariaLabel?: string
}

export function FieldTooltip({ text, ariaLabel }: Props) {
  const label = ariaLabel ?? text
  return (
    <span className="field-tooltip-wrap">
      <button
        type="button"
        className="field-tooltip-trigger"
        aria-label={label}
      >
        <span aria-hidden="true">i</span>
      </button>
      <span className="field-tooltip" role="tooltip">
        {text}
      </span>
    </span>
  )
}
