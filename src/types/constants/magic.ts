// Constantes pour Magic: The Gathering
// ====================================

export const MTG_COLOR_ORDER = ['W', 'U', 'B', 'R', 'G', 'M', 'C'] as const
export const MTG_TYPE_ORDER = [
  'creature',
  'instant',
  'sorcery',
  'enchantment',
  'artifact',
  'planeswalker',
  'battle',
  'land',
  'other',
] as const
export const MTG_BUCKETS = ['1-', '2', '3', '4', '5', '6', '7+'] as const

// Types pour les buckets CMC
export type CMCBucket = (typeof MTG_BUCKETS)[number]
