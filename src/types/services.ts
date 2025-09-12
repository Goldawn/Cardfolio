// Types pour les services mis à jour pour la cohérence avec la BDD
// =================================================================

import { Card } from './base'

// Types pour les cartes enrichies (mis à jour)
export type EnrichedCard = {
  id: string
  externalId: string // ✅ externalId au lieu de externalId
  name: string
  type?: string
  legalities?: Record<string, string>
  rarity?: string
  manaCost?: string
  cmc?: number
  colors?: string[]
  imageUri?: string
}

// Types pour les problèmes de légalité (mis à jour)
export type LegalityIssue = {
  externalId: string // ✅ externalId au lieu de externalId
  name: string
  qty: number
  problems: string[]
}

// Types pour les résultats de légalité de deck (mis à jour)
export type DeckLegalityResult = {
  format: string
  total: number
  minRequired: number
  sizeOk: boolean
  isSingleton: boolean
  issues: LegalityIssue[]
  commander?: {
    name: string
    externalId: string // ✅ externalId au lieu de externalId
    colors: string[]
  }
  colorIdentity?: string[]
  warnings?: string[]
}

// Types pour les options de vérification de rareté (mis à jour)
export type RarityCheckOptions = {
  format: string
  enriched: EnrichedCard[]
  deckCards: Array<{ externalId: string; quantity: number }> // ✅ externalId
  commanderExternalId?: string | null // ✅ externalId
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
  order?:
    | 'name'
    | 'set'
    | 'released'
    | 'rarity'
    | 'color'
    | 'usd'
    | 'eur'
    | 'tix'
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

// Types pour les services d'import de cartes
export type CardImportResult = {
  success: boolean
  card?: Card
  error?: string
}

export type BulkImportResult = {
  success: number
  errors: Array<{
    externalId: string
    error: string
  }>
}

// Types pour les services de synchronisation
export type SyncResult = {
  imported: number
  updated: number
  errors: number
  missingCards: string[] // externalIds manquants
}
