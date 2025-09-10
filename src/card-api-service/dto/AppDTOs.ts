import type { CardRarity, Currency } from '@/types/base'
import type { MTGCard } from '@/types/games/magic'

/**
 * DTOs pour les données de l'application (format unifié)
 */

export interface GameSet {
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

export interface PriceData {
  cardId: string
  cardName: string
  setCode?: string
  prices: {
    usd?: number
    eur?: number
    tix?: number
  }
  lastUpdated: string
  source: string
  marketPrice?: {
    usd?: number
    eur?: number
  }
  foilPrice?: {
    usd?: number
    eur?: number
  }
}

export interface CardSearchResult {
  cards: MTGCard[]
  totalResults: number
  hasMore: boolean
  nextPage?: string
  query: string
  filters?: SearchFilters
}

export interface SearchFilters {
  colors?: string[]
  types?: string[]
  rarities?: CardRarity[]
  sets?: string[]
  formats?: string[]
  priceRange?: {
    min: number
    max: number
    currency: Currency
  }
}

// Réexport des types existants pour cohérence
export type { MTGCard } from '@/types/games/magic'
export type { CardRarity, Currency } from '@/types/base'

// Export direct pour éviter les problèmes d'import
export type { MTGCard as MTGCardType } from '@/types/games/magic'
