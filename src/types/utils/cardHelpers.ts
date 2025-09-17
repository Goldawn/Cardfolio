// Helpers pour remplacer les transformations manuelles de cartes
// =============================================================

import { GameCard } from './guards'
import {
  transformEnrichedToGameCard,
  transformToGameCard,
  type EnrichedCardData,
  type RawCardData,
} from './transformers'

/**
 * Helper pour remplacer les transformations manuelles dans WishlistSearchSection
 * Remplace: results.map(card => ({ ... }) as unknown as MTGCard)
 */
export function transformSearchResults(
  results: EnrichedCardData[]
): GameCard[] {
  return results.map(transformEnrichedToGameCard)
}

/**
 * Helper pour transformer les résultats Prisma (avec gameType string)
 */
export function transformPrismaResults(results: any[]): GameCard[] {
  return results.map(card =>
    transformEnrichedToGameCard({
      ...card,
      gameType: card.gameType as any, // Cast pour compatibilité avec GameType
    })
  )
}

/**
 * Helper pour remplacer les transformations manuelles dans CollectionClient
 * Remplace: cards.map(card => ({ ... }) as unknown as MTGCard)
 */
export function transformCollectionCards(cards: RawCardData[]): GameCard[] {
  return cards.map(card => transformToGameCard(card, card.gameType || 'magic'))
}

/**
 * Helper pour remplacer les transformations manuelles dans DeckClient
 * Remplace: cards.map(card => ({ ... }) as unknown as MTGCard)
 */
export function transformDeckCards(cards: RawCardData[]): GameCard[] {
  return cards.map(card => transformToGameCard(card, card.gameType || 'magic'))
}

/**
 * Helper pour remplacer les transformations manuelles dans FetchCardInput
 * Remplace: ({ ... }) as unknown as MTGCard
 */
export function transformFetchedCard(cardData: RawCardData): GameCard {
  return transformToGameCard(cardData, cardData.gameType || 'magic')
}

/**
 * Helper pour remplacer les transformations manuelles dans ManualAdd
 * Remplace: ({ ... }) as unknown as MTGCard
 */
export function transformManualCard(cardData: RawCardData): GameCard {
  return transformToGameCard(cardData, cardData.gameType || 'magic')
}

/**
 * Helper pour remplacer les transformations manuelles dans useCards
 * Remplace: ({ ... }) as unknown as MTGCard
 */
export function transformImportedCard(cardData: RawCardData): GameCard {
  return transformToGameCard(cardData, cardData.gameType || 'magic')
}

/**
 * Helper générique pour toutes les transformations de cartes
 * Utilise les données brutes et le type de jeu
 */
export function createGameCard(
  data: RawCardData,
  gameType:
    | 'magic'
    | 'pokemon'
    | 'lorcana'
    | 'yugioh'
    | 'flesh-and-blood' = 'magic'
): GameCard {
  return transformToGameCard(data, gameType)
}


/**
 * Helper pour créer une carte avec des données minimales
 * Remplace les créations manuelles de cartes
 */
export function createMinimalCard(
  externalId: string,
  name: string,
  gameType:
    | 'magic'
    | 'pokemon'
    | 'lorcana'
    | 'yugioh'
    | 'flesh-and-blood' = 'magic',
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
 * Helper pour mettre à jour une carte existante
 * Remplace les mises à jour manuelles
 */
export function updateCard(
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
 * Helper pour filtrer et valider les cartes
 * Remplace les filtres manuelles
 */
export function filterValidCards(cards: any[]): GameCard[] {
  return cards
    .filter(
      card =>
        card &&
        typeof card.externalId === 'string' &&
        typeof card.name === 'string' &&
        typeof card.gameType === 'string'
    )
    .map(card => transformToGameCard(card, card.gameType))
}

/**
 * Helper pour grouper les cartes par type de jeu
 */
export function groupCardsByGameType(
  cards: GameCard[]
): Record<string, GameCard[]> {
  return cards.reduce(
    (groups, card) => {
      const gameType = card.gameType
      if (!groups[gameType]) {
        groups[gameType] = []
      }
      groups[gameType].push(card)
      return groups
    },
    {} as Record<string, GameCard[]>
  )
}

/**
 * Helper pour extraire les IDs des cartes
 */
export function extractCardIds(cards: GameCard[]): string[] {
  return cards.map(card => card.externalId || card.id)
}

/**
 * Helper pour extraire les noms des cartes
 */
export function extractCardNames(cards: GameCard[]): string[] {
  return cards.map(card => card.name)
}

/**
 * Helper pour créer un mapping ID -> Carte
 */
export function createCardMap(cards: GameCard[]): Map<string, GameCard> {
  return new Map(cards.map(card => [card.externalId || card.id, card]))
}

/**
 * Helper pour trouver une carte par ID
 */
export function findCardById(
  cards: GameCard[],
  id: string
): GameCard | undefined {
  return cards.find(card => card.externalId === id || card.id === id)
}

/**
 * Helper pour trouver une carte par nom
 */
export function findCardByName(
  cards: GameCard[],
  name: string
): GameCard | undefined {
  return cards.find(card => card.name === name)
}
