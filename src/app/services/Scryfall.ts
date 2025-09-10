/**
 * Nouveau service Scryfall utilisant l'architecture Card API Service
 * Remplace src/app/services/Scryfall.ts
 */

import { CardServiceFactory } from '@/card-api-service'
import type { GameSet } from '@/card-api-service/dto'
import type { MTGCard } from '@/types/games/magic'

// Instance singleton du service
let cardServiceInstance: any = null

const getCardService = () => {
  if (!cardServiceInstance) {
    cardServiceInstance = CardServiceFactory.create()
  }
  return cardServiceInstance
}

/**
 * Récupère tous les sets disponibles
 * Remplace l'ancienne fonction fetchSets()
 */
export const fetchSets = async (): Promise<GameSet[]> => {
  const cardService = getCardService()
  return await cardService.fetchSets()
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
  const cardService = getCardService()
  const cards = await cardService.fetchSetCards({
    setCode,
    language: lang,
    options: {
      fetchAllPages: false // Récupère seulement la première page pour compatibilité
    }
  })

  // Retourne le format attendu par l'ancien code
  return {
    data: cards,
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
  const cardService = getCardService()
  const cards = await cardService.fetchMoreCards(nextPage)

  return {
    data: cards,
    has_more: false, // TODO: Implémenter la pagination si nécessaire
    total_cards: cards.length
  }
}

/**
 * Récupère une carte par son ID
 * Nouvelle fonctionnalité
 */
export const fetchCard = async (cardId: string): Promise<MTGCard> => {
  const cardService = getCardService()
  return await cardService.fetchCard({ cardId })
}

/**
 * Récupère une carte par son nom
 * Nouvelle fonctionnalité
 */
export const fetchCardByName = async (cardName: string): Promise<MTGCard> => {
  const cardService = getCardService()
  return await cardService.fetchCardByName(cardName)
}

/**
 * Recherche des cartes
 * Nouvelle fonctionnalité
 */
export const searchCards = async (query: string): Promise<MTGCard[]> => {
  const cardService = getCardService()
  return await cardService.searchCards({ query })
}

// Export des types pour compatibilité
export type { GameSet } from '@/card-api-service/dto'
export type { MTGCard } from '@/types/games/magic'
