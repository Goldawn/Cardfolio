// Types de base mis à jour pour la cohérence avec la BDD
// ======================================================

// Types de base
export type GameType =
  | 'magic'
  | 'pokemon'
  | 'lorcana'
  | 'yugioh'
  | 'flesh-and-blood'

export type CardRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'mythic'
  | 'special'
  | 'other'

export type Currency = 'eur' | 'usd'

export type SortOrder = 'asc' | 'desc'

// Structure d'une carte alignée avec le modèle Prisma
export type Card<
  TGameData = any,
  TColor = string,
  TCardType = string,
  TFormat = string,
> = {
  // Identifiants (alignés avec Prisma)
  id: string
  externalId: string // ✅ ID générique de l'API externe
  name: string
  gameType: GameType

  // Informations de base
  setName?: string
  setCode?: string
  collectorNumber?: string
  lang?: string
  rarity?: CardRarity
  artist?: string

  // Images
  imageSmall?: string
  imageNormal?: string
  imageLarge?: string
  imageArtCrop?: string

  // Données de jeu (JSON pour flexibilité)
  gameData: TGameData
  colors?: TColor[] // ✅ Array au lieu de JSON pour TypeScript
  cardType?: TCardType
  format?: TFormat

  // Légalités
  legalities?: Record<string, string>

  // Prix
  priceUsd?: number
  priceEur?: number
  priceTix?: number
  priceFoilUsd?: number
  priceFoilEur?: number
  lastPriceUpdate?: Date

  // Quantité et allocation (pour les collections et decks)
  quantity?: number
  allocated?: number
  dateAdded?: Date
  priceHistory?: PriceHistory[]

  // Métadonnées
  createdAt?: Date
  updatedAt?: Date

  // Relations (optionnelles selon le contexte)
  collectionId?: string
  wishlistId?: string
  deckId?: string
}

export type CardImages = {
  small?: string
  normal?: string
  large?: string
  artCrop?: string
}

export type PriceHistory = {
  date: string
  usd: number
  eur: number
  tix?: number
}

// Helper types pour extraire les types
export type ExtractGameType<T> =
  T extends Card<any, any, any, any> ? T['gameType'] : never
export type ExtractGameData<T> =
  T extends Card<infer U, any, any, any> ? U : never
export type ExtractColors<T> =
  T extends Card<any, infer U, any, any> ? U : never
export type ExtractCardTypes<T> =
  T extends Card<any, any, infer U, any> ? U : never
export type ExtractFormats<T> =
  T extends Card<any, any, any, infer U> ? U : never
