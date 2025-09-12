// Types de Collection mis à jour pour la cohérence avec la BDD
// =============================================================

import { Card, GameType } from './base'

// Collection avec relation directe vers Card
export type Collection<TGameType extends GameType = GameType> = {
  id: string
  name: string
  gameType: TGameType
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
  cards: Card[] // ✅ Relation directe au lieu de CollectionItem[]
}

// Wishlist avec relation directe vers Card
export type WishlistList<TGameType extends GameType = GameType> = {
  id: string
  name: string
  gameType: TGameType
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
  cards: Card[] // ✅ Relation directe au lieu de WishlistItem[]
}

// CollectionChangeLog mis à jour
export type CollectionChangeLog<TGameType extends GameType = GameType> = {
  id: string
  userId: string
  cardId: string // ✅ Référence vers Card.id
  gameType: TGameType
  changeType: 'add' | 'remove' | 'update'
  quantity: number
  totalAfter: number
  changedAt: Date
}

// Types spécifiques utilisés dans l'application (mis à jour)
// =========================================================

export type AppCollectionItem = {
  externalId: string // ✅ externalId au lieu de externalId
  quantity: number
  priceHistory: import('./base').PriceHistory[]
  dbId: string
}

export type CollectionActions = {
  addToCollection: (externalId: string, priceEntry: any) => Promise<any> // ✅ externalId
  updateCollectionQuantity: (cardId: string, delta: number) => Promise<any>
  removeFromCollection: (cardId: string) => Promise<any>
}

// Types pour les opérations de collection
export type CollectionOperation = {
  type: 'add' | 'remove' | 'update'
  externalId: string // ✅ externalId
  quantity?: number
  priceEntry?: any
}

// Types pour les statistiques de collection
export type CollectionStats = {
  totalCards: number
  totalValue: number
  cardsByRarity: Record<string, number>
  cardsByType: Record<string, number>
  cardsBySet: Record<string, number>
}
