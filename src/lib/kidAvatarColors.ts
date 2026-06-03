export const KID_AVATAR_COLORS = [
  { id: 'green', hex: '#00a651', label: 'Green' },
  { id: 'indigo', hex: '#6366f1', label: 'Indigo' },
  { id: 'amber', hex: '#f59e0b', label: 'Amber' },
  { id: 'pink', hex: '#ec4899', label: 'Pink' },
  { id: 'purple', hex: '#8b5cf6', label: 'Purple' },
  { id: 'teal', hex: '#14b8a6', label: 'Teal' },
  { id: 'coral', hex: '#f97316', label: 'Coral' },
] as const

export type KidAvatarColorId = (typeof KID_AVATAR_COLORS)[number]['id']

const COLOR_BY_ID = new Map(
  KID_AVATAR_COLORS.map((c) => [c.id, c] as const),
)

export function kidAvatarColorHex(id: KidAvatarColorId): string {
  return COLOR_BY_ID.get(id)?.hex ?? KID_AVATAR_COLORS[0].hex
}

export function defaultAvatarColorForIndex(index: number): KidAvatarColorId {
  return KID_AVATAR_COLORS[index % KID_AVATAR_COLORS.length]!.id
}

export function normalizeAvatarColorId(
  raw: unknown,
  fallbackIndex = 0,
): KidAvatarColorId {
  if (typeof raw === 'string' && COLOR_BY_ID.has(raw as KidAvatarColorId)) {
    return raw as KidAvatarColorId
  }
  return defaultAvatarColorForIndex(fallbackIndex)
}

export function kidInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}
