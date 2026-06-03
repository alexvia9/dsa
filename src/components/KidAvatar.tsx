import {
  kidAvatarColorHex,
  kidInitial,
  type KidAvatarColorId,
} from '../lib/kidAvatarColors'

type Props = {
  name: string
  colorId: KidAvatarColorId
  className?: string
}

export function KidAvatar({ name, colorId, className = '' }: Props) {
  return (
    <span
      className={`kid-card-avatar ${className}`.trim()}
      style={{ backgroundColor: kidAvatarColorHex(colorId) }}
      aria-hidden
    >
      {kidInitial(name)}
    </span>
  )
}
