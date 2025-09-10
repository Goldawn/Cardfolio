/**
 * Nouveau service de prix utilisant l'architecture Card API Service
 * Remplace src/app/services/pricing.ts
 */

import { CardServiceFactory } from '@/card-api-service'
import type { PriceData } from '@/card-api-service/dto'

// Instance singleton du service
let cardServiceInstance: any = null

const getCardService = () => {
  if (!cardServiceInstance) {
    cardServiceInstance = CardServiceFactory.create()
  }
  return cardServiceInstance
}

/**
 * Récupère le prix d'une carte par son nom
 * Remplace l'ancienne fonction fetchCardPrice()
 */
export const fetchCardPrice = async (cardName: string): Promise<{
  usd: number
  eur: number
}> => {
  try {
    const cardService = getCardService()
    const card = await cardService.fetchCardByName(cardName)
    
    // Extraire les prix depuis l'historique des prix
    const latestPrice = card.priceHistory?.[0]
    
    return {
      usd: latestPrice?.usd || 0,
      eur: latestPrice?.eur || 0,
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du prix:', error)
    return { usd: 0, eur: 0 }
  }
}

/**
 * Récupère le prix d'une carte par son ID
 * Nouvelle fonctionnalité
 */
export const fetchCardPriceById = async (cardId: string): Promise<{
  usd: number
  eur: number
}> => {
  try {
    const cardService = getCardService()
    const card = await cardService.fetchCard({ cardId })
    
    // Extraire les prix depuis l'historique des prix
    const latestPrice = card.priceHistory?.[0]
    
    return {
      usd: latestPrice?.usd || 0,
      eur: latestPrice?.eur || 0,
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du prix:', error)
    return { usd: 0, eur: 0 }
  }
}

/**
 * Récupère les prix de plusieurs cartes
 * Nouvelle fonctionnalité
 */
export const fetchBulkCardPrices = async (cardNames: string[]): Promise<Array<{
  cardName: string
  usd: number
  eur: number
}>> => {
  try {
    const cardService = getCardService()
    const results = await Promise.allSettled(
      cardNames.map(async (cardName) => {
        const card = await cardService.fetchCardByName(cardName)
        const latestPrice = card.priceHistory?.[0]
        
        return {
          cardName,
          usd: latestPrice?.usd || 0,
          eur: latestPrice?.eur || 0,
        }
      })
    )

    return results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
  } catch (error) {
    console.error('Erreur lors de la récupération des prix en lot:', error)
    return []
  }
}

// Export des types pour compatibilité
export type { PriceData } from '@/card-api-service/dto'
