/**
 * DTOs pour les requêtes vers les services
 */

export interface CardFetchRequestDTO {
  cardId?: string
  cardName?: string
  provider?: string
  options?: FetchOptionsDTO
}

export interface SetFetchRequestDTO {
  setCode: string
  language?: string
  provider?: string
  options?: SetFetchOptionsDTO
}

export interface SearchRequestDTO {
  query: string
  provider?: string
  options?: SearchOptionsDTO
}

export interface BulkFetchRequestDTO {
  cardIds: string[]
  provider?: string
  options?: BulkFetchOptionsDTO
}

export interface FetchOptionsDTO {
  provider?: string
  fallbackProviders?: string[]
  cacheTtl?: number
  includePrice?: boolean
  includeLegalities?: boolean
  timeout?: number
  retryAttempts?: number
}

export interface SetFetchOptionsDTO extends FetchOptionsDTO {
  fetchAllPages?: boolean
  pageSize?: number
  delayBetweenPages?: number
  includeBasicLands?: boolean
}

export interface SearchOptionsDTO extends FetchOptionsDTO {
  unique?: 'prints' | 'cards' | 'art'
  order?: 'name' | 'set' | 'released' | 'rarity' | 'color' | 'usd' | 'eur' | 'tix'
  dir?: 'auto' | 'asc' | 'desc'
  page?: number
}

export interface BulkFetchOptionsDTO extends FetchOptionsDTO {
  batchSize?: number
  delayBetweenBatches?: number
  continueOnError?: boolean
}
