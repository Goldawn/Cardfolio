// Types spécifiques Magic: The Gathering mis à jour
// ================================================

import { Card } from '../base'
import { Collection, Decklist, WishlistList } from '../collections'

export type MTGColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C' | 'M'
export type MTGCardType =
  | 'creature'
  | 'instant'
  | 'sorcery'
  | 'enchantment'
  | 'artifact'
  | 'planeswalker'
  | 'battle'
  | 'land'
  | 'other'
export type MTGFormat =
  | 'commander'
  | 'standard'
  | 'modern'
  | 'legacy'
  | 'vintage'
  | 'pioneer'
  | 'historic'
  | 'brawl'
  | 'oathbreaker'
  | 'gladiator'
  | 'paupercommander'
  | 'standardbrawl'
  | 'timeless'
  | 'alchemy'
  | 'penny'

export type MTGGameData = {
  manaCost?: string | undefined
  manaValue?: number | undefined
  cmc?: number | undefined
  convertedManaCost?: number | undefined
  type?: string | undefined
  typeLine?: string | undefined
  oracleText?: string | undefined
  flavorText?: string | undefined
  power?: string | undefined
  toughness?: string | undefined
  colorIdentity?: MTGColor[] | undefined
  card_faces?: MTGCardFace[] | undefined
}

export type MTGCardFace = {
  name?: string | undefined
  mana_cost?: string | undefined
  type_line?: string | undefined
  oracle_text?: string | undefined
  power?: string | undefined
  toughness?: string | undefined
  image_uris?:
    | {
        small?: string
        normal?: string
        large?: string
        art_crop?: string
      }
    | undefined
}

// Carte Magic alignée avec le modèle Prisma
export type MTGCard = Card<MTGGameData, MTGColor, MTGCardType, MTGFormat> & {
  gameType: 'magic'
}

// Collections et decks Magic
export type MTGCollection = Collection<'magic'>
export type MTGWishlist = WishlistList<'magic'>
export type MTGDecklist = Decklist<'magic', MTGColor, MTGFormat>

// Types spécifiques pour les opérations Magic
export type MTGCollectionOperation = {
  type: 'add' | 'remove' | 'update'
  externalId: string // ✅ externalId au lieu de externalId
  quantity?: number
  priceEntry?: any
}

export type MTGDeckOperation = {
  type: 'add' | 'remove' | 'update' | 'allocate'
  externalId: string // ✅ externalId au lieu de externalId
  quantity?: number
  allocated?: number
}

// Types pour la validation Magic
export type MTGDeckValidation = {
  isValid: boolean
  errors: string[]
  warnings: string[]
  formatCompliance: boolean
  cardCount: number
  colorIdentity: MTGColor[]
  commander?: {
    name: string
    externalId: string // ✅ externalId
    colors: MTGColor[]
  }
}

// Types pour les statistiques Magic
export type MTGCollectionStats = {
  totalCards: number
  totalValue: number
  cardsByRarity: Record<string, number>
  cardsByType: Record<MTGCardType, number>
  cardsByColor: Record<MTGColor, number>
  cardsBySet: Record<string, number>
}

export type MTGDeckStats = {
  totalCards: number
  cardsByType: Record<MTGCardType, number>
  cardsByColor: Record<MTGColor, number>
  averageManaCost: number
  colorIdentity: MTGColor[]
  curve: Record<number, number> // CMC -> nombre de cartes
}
