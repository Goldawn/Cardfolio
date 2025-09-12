/**
 * Nouveau service de formatage utilisant l'architecture Card API Service
 * Remplace src/app/services/FormatCard.ts
 */

import { cardApiManager } from '@/app/services/CardApiManager'
import type { ScryfallCardDTO } from '@/card-api-service/dto'
import type { MTGCard } from '@/types/games/magic'

// Instance de l'adapter via le manager
const getScryfallAdapter = () => {
  const cardService = cardApiManager.getCardService()
  return cardService.getAdapter('scryfall')
}

/**
 * Formate une carte Scryfall vers le format de l'application
 * Remplace l'ancienne fonction formatCard()
 */
export const formatCard = (rawCard: ScryfallCardDTO): MTGCard => {
  const adapter = getScryfallAdapter()
  if (!adapter) {
    throw new Error('Scryfall adapter not found')
  }
  return adapter.transformCard(rawCard)
}

/**
 * Formate une liste de cartes Scryfall
 * Nouvelle fonctionnalité
 */
export const formatCards = (rawCards: ScryfallCardDTO[]): MTGCard[] => {
  const adapter = getScryfallAdapter()
  if (!adapter) {
    throw new Error('Scryfall adapter not found')
  }
  return adapter.transformCards(rawCards)
}

/**
 * Valide les données brutes d'une carte
 * Nouvelle fonctionnalité
 */
export const validateCardData = (rawCard: any): boolean => {
  const adapter = getScryfallAdapter()
  if (!adapter) {
    throw new Error('Scryfall adapter not found')
  }
  return adapter.validateRawData(rawCard)
}

/**
 * Extrait l'ID d'une carte depuis les données brutes
 * Nouvelle fonctionnalité
 */
export const extractCardId = (rawCard: ScryfallCardDTO): string => {
  const adapter = getScryfallAdapter()
  if (!adapter) {
    throw new Error('Scryfall adapter not found')
  }
  return adapter.extractCardId(rawCard)
}

/**
 * Extrait le nom d'une carte depuis les données brutes
 * Nouvelle fonctionnalité
 */
export const extractCardName = (rawCard: ScryfallCardDTO): string => {
  const adapter = getScryfallAdapter()
  if (!adapter) {
    throw new Error('Scryfall adapter not found')
  }
  return adapter.extractCardName(rawCard)
}

// Export des types pour compatibilité
export type { ScryfallCardDTO } from '@/card-api-service/dto'
export type { MTGCard } from '@/types/games/magic'
