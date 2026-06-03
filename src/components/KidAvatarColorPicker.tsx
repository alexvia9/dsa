import {
  KID_AVATAR_COLORS,
  type KidAvatarColorId,
} from '../lib/kidAvatarColors'

type Props = {
  value: KidAvatarColorId
  onChange: (color: KidAvatarColorId) => void
  label?: string
  compact?: boolean
}

export function KidAvatarColorPicker({
  value,
  onChange,
  label = 'Avatar color',
  compact = false,
}: Props) {
  return (
    <fieldset
      className={
        compact ? 'kid-avatar-color-picker kid-avatar-color-picker--compact' : 'kid-avatar-color-picker'
      }
    >
      <legend className="label kid-avatar-color-picker-label">{label}</legend>
      <div
        className="kid-avatar-color-swatches"
        role="radiogroup"
        aria-label={label}
      >
        {KID_AVATAR_COLORS.map((color) => {
          const selected = value === color.id
          return (
            <label
              key={color.id}
              className={
                'kid-avatar-color-swatch' +
                (selected ? ' kid-avatar-color-swatch--selected' : '')
              }
              title={color.label}
            >
              <input
                type="radio"
                name="kid-avatar-color"
                value={color.id}
                checked={selected}
                onChange={() => onChange(color.id)}
                className="kid-avatar-color-input"
              />
              <span
                className="kid-avatar-color-dot"
                style={{ backgroundColor: color.hex }}
                aria-hidden
              />
              <span className="visually-hidden">{color.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
