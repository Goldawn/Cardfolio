// Types pour les Sets de cartes
// =============================

export type GameSet = {
  id: string
  code: string
  name: string
  releaseDate: string
  setType: string
  cardCount: number
  digital: boolean
  iconUri?: string
  parentSetCode?: string
  block?: string
  blockCode?: string
}

// Types spécifiques pour les sets
export type SetType = 
  | 'core'
  | 'expansion'
  | 'masters'
  | 'masterpiece'
  | 'from_the_vault'
  | 'spellbook'
  | 'premium_deck'
  | 'duel_deck'
  | 'commander'
  | 'planechase'
  | 'archenemy'
  | 'vanguard'
  | 'funny'
  | 'starter'
  | 'box'
  | 'promo'
  | 'token'
  | 'memorabilia'
  | 'alchemy'
  | 'other'

export type SetSearchFilters = {
  setType?: SetType[]
  block?: string[]
  digital?: boolean
  releaseDateFrom?: string
  releaseDateTo?: string
  cardCountMin?: number
  cardCountMax?: number
}

export type SetSortOption = 
  | 'name'
  | 'code'
  | 'releaseDate'
  | 'cardCount'
  | 'setType'
