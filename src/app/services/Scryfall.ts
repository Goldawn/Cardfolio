/**
 * Service Scryfall utilisant le CardApiManager centralisé
 * Remplace src/app/services/Scryfall.ts
 */

import { cardApiManager } from './CardApiManager'
import type { GameSet } from '@/card-api-service/dto'
import type { MTGCard } from '@/types/games/magic'

/**
 * Récupère tous les sets disponibles
 * Remplace l'ancienne fonction fetchSets()
 */
export const fetchSets = async (): Promise<GameSet[]> => {
  return await cardApiManager.fetchSets()
}

/**
 * Récupère les cartes d'un set
 * Remplace l'ancienne fonction fetchSetCards()
 */
export const fetchSetCards = async (setCode: string, lang: string = 'en'): Promise<{
  data: MTGCard[]
  has_more: boolean
  next_page?: string
  total_cards: number
}> => {
  const cards = await cardApiManager.searchCards(`set:${setCode}`, {
    unique: 'prints',
    language: lang
  })

  // Retourne le format attendu par l'ancien code
  return {
    data: cards as MTGCard[],
    has_more: false, // TODO: Implémenter la pagination si nécessaire
    total_cards: cards.length
  }
}

/**
 * Récupère la suite des cartes (pagination)
 * Remplace l'ancienne fonction fetchMoreCards()
 */
export const fetchMoreCards = async (nextPage: string): Promise<{
  data: MTGCard[]
  has_more: boolean
  next_page?: string
  total_cards: number
}> => {
  // Pour l'instant, on utilise searchCards avec une pagination basique
  const cards = await cardApiManager.searchCards('', { page: nextPage })

  return {
    data: cards as MTGCard[],
    has_more: false, // TODO: Implémenter la pagination si nécessaire
    total_cards: cards.length
  }
}

/**
 * Récupère une carte par son ID
 * Nouvelle fonctionnalité
 */
export const fetchCard = async (cardId: string): Promise<MTGCard> => {
  return await cardApiManager.fetchCard(cardId) as MTGCard
}

/**
 * Récupère une carte par son nom
 * Nouvelle fonctionnalité
 */
export const fetchCardByName = async (cardName: string): Promise<MTGCard> => {
  const results = await cardApiManager.searchCards(`!"${cardName}"`, { 
    unique: 'prints' 
  })
  
  return results.length > 0 ? results[0] as MTGCard : null as any
}

/**
 * Recherche des cartes
 * Nouvelle fonctionnalité
 */
export const searchCards = async (query: string): Promise<MTGCard[]> => {
  return await cardApiManager.searchCards(query) as MTGCard[]
}

// Export des types pour compatibilité
export type { GameSet } from '@/card-api-service/dto'
export type { MTGCard } from '@/types/games/magic'
