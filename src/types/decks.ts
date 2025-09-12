// Types de Deck mis à jour pour la cohérence avec la BDD
// ======================================================

import { Card, GameType } from './base-updated'

// Decklist avec relation directe vers Card
export type Decklist<
  TGameType extends GameType = GameType,
  TColor = string,
  TFormat = string,
> = {
  id: string
  name: string
  gameType: TGameType
  colors?: TColor[]
  showcasedCardId?: string // ✅ Référence vers Card.id
  showcasedArt?: string
  format: TFormat
  isLocked: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
  userId: string
  cards: Card[] // ✅ Relation directe au lieu de DeckCard[]
}

// Type spécifique utilisé dans l'application (mis à jour)
// ======================================================

export type AppDeckCard = {
  externalId: string // ✅ externalId au lieu de scryfallId
  quantity: number
  allocated?: number
}

// Types pour les opérations de deck
export type DeckOperation = {
  type: 'add' | 'remove' | 'update' | 'allocate'
  externalId: string // ✅ externalId
  quantity?: number
  allocated?: number
}

// Types pour la validation de deck
export type DeckValidation = {
  isValid: boolean
  errors: string[]
  warnings: string[]
  formatCompliance: boolean
  cardCount: number
  colorIdentity: string[]
}

// Types pour les statistiques de deck
export type DeckStats = {
  totalCards: number
  cardsByType: Record<string, number>
  cardsByColor: Record<string, number>
  averageManaCost: number
  colorIdentity: string[]
}
