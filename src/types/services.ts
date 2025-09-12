// Types pour les services
// =======================

import type { GameCard } from './index'

// Types pour les cartes enrichies
export type EnrichedCard = {
  id: string
  name: string
  type?: string
  legalities?: Record<string, string>
  rarity?: string
  manaCost?: string
  cmc?: number
  colors?: string[]
  imageUri?: string
  scryfallId?: string
}

// Types pour les problèmes de légalité
export type LegalityIssue = {
  scryfallId: string
  name: string
  qty: number
  problems: string[]
}

// Types pour les résultats de légalité de deck
export type DeckLegalityResult = {
  format: string
  total: number
  minRequired: number
  sizeOk: boolean
  isSingleton: boolean
  issues: LegalityIssue[]
  commander?: {
    name: string
    scryfallId: string
    colors: string[]
  }
  colorIdentity?: string[]
  warnings?: string[]
}

// Types pour les options de vérification de rareté
export type RarityCheckOptions = {
  format: string
  enriched: EnrichedCard[]
  deckCards: Array<{ scryfallId: string; quantity: number }>
  commanderScryfallId?: string | null
}

// Types pour les services de formatage
export type FormatCardOptions = {
  includePrice?: boolean
  includeLegalities?: boolean
  includeImage?: boolean
  language?: string
}

// Types pour les services de recherche
export type SearchServiceOptions = {
  unique?: 'prints' | 'cards' | 'art'
  order?: 'name' | 'set' | 'released' | 'rarity' | 'color' | 'usd' | 'eur' | 'tix'
  dir?: 'auto' | 'asc' | 'desc'
  page?: number
  language?: string
}

// Types pour les services de cache
export type CacheServiceOptions = {
  ttl?: number
  key?: string
  tags?: string[]
  invalidateOnUpdate?: boolean
}

// Types pour les services de monitoring
export type ServiceHealthStatus = {
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastCheck: string
  responseTime?: number
  errorRate?: number
  uptime?: number
}

// Types pour les services d'erreur
export type ServiceError = {
  code: string
  message: string
  details?: any
  timestamp: string
  retryable: boolean
}

// Types pour les services de validation
export type ValidationResult = {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Types pour les services de transformation
export type TransformOptions = {
  includeMetadata?: boolean
  preserveOriginal?: boolean
  customFields?: Record<string, any>
}
