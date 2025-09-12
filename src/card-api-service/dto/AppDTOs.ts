import type { CardRarity, Currency } from '@/types/base'
import type { MTGCard } from '@/types/games/magic'
import type { GameSet } from '@/types/sets'

/**
 * DTOs pour les données de l'application (format unifié)
 */

// Réexporter GameSet depuis @types/ pour cohérence
export type { GameSet }

export interface PriceData {
  cardId: string
  cardName: string
  setCode?: string | undefined
  prices: {
    usd?: number | undefined
    eur?: number | undefined
    tix?: number | undefined
  }
  lastUpdated: string
  source: string
  marketPrice?:
    | {
        usd?: number | undefined
        eur?: number | undefined
      }
    | undefined
  foilPrice?:
    | {
        usd?: number | undefined
        eur?: number | undefined
      }
    | undefined
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
export type { CardRarity, Currency } from '@/types/base'
export type { MTGCard } from '@/types/games/magic'

// Export direct pour éviter les problèmes d'import
export type { MTGCard as MTGCardType } from '@/types/games/magic'
