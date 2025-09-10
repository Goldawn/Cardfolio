/**
 * Nouveau service de formatage utilisant l'architecture Card API Service
 * Remplace src/app/services/FormatCard.ts
 */

import { ScryfallAdapter } from '@/card-api-service'
import type { ScryfallCardDTO } from '@/card-api-service/dto'
import type { MTGCard } from '@/types/games/magic'

// Instance singleton de l'adapter
const scryfallAdapter = new ScryfallAdapter()

/**
 * Formate une carte Scryfall vers le format de l'application
 * Remplace l'ancienne fonction formatCard()
 */
export const formatCard = (rawCard: ScryfallCardDTO): MTGCard => {
  return scryfallAdapter.transformCard(rawCard)
}

/**
 * Formate une liste de cartes Scryfall
 * Nouvelle fonctionnalité
 */
export const formatCards = (rawCards: ScryfallCardDTO[]): MTGCard[] => {
  return scryfallAdapter.transformCards(rawCards)
}

/**
 * Valide les données brutes d'une carte
 * Nouvelle fonctionnalité
 */
export const validateCardData = (rawCard: any): boolean => {
  return scryfallAdapter.validateRawData(rawCard)
}

/**
 * Extrait l'ID d'une carte depuis les données brutes
 * Nouvelle fonctionnalité
 */
export const extractCardId = (rawCard: ScryfallCardDTO): string => {
  return scryfallAdapter.extractCardId(rawCard)
}

/**
 * Extrait le nom d'une carte depuis les données brutes
 * Nouvelle fonctionnalité
 */
export const extractCardName = (rawCard: ScryfallCardDTO): string => {
  return scryfallAdapter.extractCardName(rawCard)
}

// Export des types pour compatibilité
export type { MTGCard } from '@/types/games/magic'
export type { ScryfallCardDTO } from '@/card-api-service/dto'
