// Helpers de transformation génériques pour les cartes
// ===================================================

import { GameType, PriceHistory } from '../base'
import { GameCard } from './guards'

// Types pour les données brutes d'API
export type RawCardData = {
  id?: string
  externalId?: string
  name?: string
  gameType?: GameType
  setCode?: string
  setName?: string
  rarity?: string
  artist?: string
  collectorNumber?: string
  gameData?: any
  image?: string
  imageSmall?: string
  imageNormal?: string
  imageLarge?: string
  imageArtCrop?: string
  priceHistory?: PriceHistory[]
  quantity?: number
  allocated?: number
  dateAdded?: Date
}

// Type pour les données de recherche enrichies
export type EnrichedCardData = {
  externalId: string
  name: string
  gameType: GameType
  setCode?: string
  setName?: string
  rarity?: string
  artist?: string
  collectorNumber?: string
  gameData?: any
  imageSmall?: string
  imageNormal?: string
  imageLarge?: string
  imageArtCrop?: string
}

/**
 * Transforme des données brutes en GameCard
 */
export function transformToGameCard<T extends GameType>(
  rawData: RawCardData,
  gameType: T
): GameCard {
  return {
    id: rawData.id || rawData.externalId || '',
    externalId: rawData.externalId || rawData.id || '',
    name: rawData.name || 'Unknown',
    gameType,
    setCode: rawData.setCode,
    setName: rawData.setName,
    rarity: rawData.rarity as any,
    artist: rawData.artist,
    collectorNumber: rawData.collectorNumber,
    gameData: rawData.gameData || {},
    image:
      rawData.image ||
      rawData.imageLarge ||
      rawData.imageNormal ||
      rawData.imageSmall ||
      '',
    imageSmall: rawData.imageSmall,
    imageNormal: rawData.imageNormal,
    imageLarge: rawData.imageLarge,
    imageArtCrop: rawData.imageArtCrop,
    priceHistory: rawData.priceHistory || [],
    quantity: rawData.quantity || 1,
    allocated: rawData.allocated || 0,
    dateAdded: rawData.dateAdded || new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as GameCard
}

/**
 * Transforme des données enrichies en GameCard
 */
export function transformEnrichedToGameCard(
  enrichedData: EnrichedCardData
): GameCard {
  return transformToGameCard(enrichedData, enrichedData.gameType)
}

/**
 * Transforme une liste de données brutes en GameCard[]
 */
export function transformToGameCards<T extends GameType>(
  rawDataList: RawCardData[],
  gameType: T
): GameCard[] {
  return rawDataList
    .map(data => transformToGameCard(data, gameType))
    .filter(Boolean)
}

/**
 * Transforme une liste de données enrichies en GameCard[]
 */
export function transformEnrichedToGameCards(
  enrichedDataList: EnrichedCardData[]
): GameCard[] {
  return enrichedDataList
    .map(data => transformEnrichedToGameCard(data))
    .filter(Boolean)
}

/**
 * Normalise une carte pour l'affichage (sélectionne la meilleure image)
 */
export function normalizeCardForDisplay(card: GameCard): GameCard {
  return {
    ...card,
    image:
      card.image ||
      card.imageLarge ||
      card.imageNormal ||
      card.imageSmall ||
      '',
  }
}

/**
 * Normalise une liste de cartes pour l'affichage
 */
export function normalizeCardsForDisplay(cards: GameCard[]): GameCard[] {
  return cards.map(normalizeCardForDisplay)
}

/**
 * Crée une carte avec des données minimales
 */
export function createMinimalGameCard(
  externalId: string,
  name: string,
  gameType: GameType,
  gameData: any = {}
): GameCard {
  return transformToGameCard(
    {
      externalId,
      name,
      gameType,
      gameData,
    },
    gameType
  )
}

/**
 * Met à jour les propriétés d'une carte existante
 */
export function updateGameCard(
  card: GameCard,
  updates: Partial<RawCardData>
): GameCard {
  return {
    ...card,
    ...updates,
    updatedAt: new Date(),
  } as GameCard
}

/**
 * Valide qu'une carte a toutes les propriétés requises
 */
export function validateGameCard(card: any): card is GameCard {
  return (
    card &&
    typeof card.id === 'string' &&
    typeof card.externalId === 'string' &&
    typeof card.name === 'string' &&
    typeof card.gameType === 'string' &&
    card.gameData !== undefined
  )
}

/**
 * Filtre les cartes valides d'une liste
 */
export function filterValidGameCards(cards: any[]): GameCard[] {
  return cards.filter(validateGameCard)
}

/**
 * Type guard pour vérifier si des données peuvent être transformées
 */
export function canTransformToGameCard(data: any): data is RawCardData {
  return data && (data.id || data.externalId) && data.name && data.gameType
}

/**
 * Helper pour extraire l'ID principal d'une carte
 */
export function getCardId(card: GameCard | RawCardData): string {
  return card.id || card.externalId || ''
}

/**
 * Helper pour extraire le nom principal d'une carte
 */
export function getCardName(card: GameCard | RawCardData): string {
  return card.name || 'Unknown'
}

/**
 * Helper pour obtenir la meilleure image disponible
 */
export function getBestImage(card: GameCard | RawCardData): string {
  return (
    card.image ||
    (card as any).imageLarge ||
    (card as any).imageNormal ||
    (card as any).imageSmall ||
    ''
  )
}
