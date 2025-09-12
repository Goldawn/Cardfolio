/**
 * Service de prix utilisant le CardApiManager centralisé
 * Remplace l'ancienne implémentation directe avec Scryfall
 */

import { cardApiManager } from './CardApiManager'

/**
 * Récupère le prix d'une carte par son nom
 * Utilise le nouveau PricingService avec fallback automatique
 */
export const fetchCardPrice = async (
  cardName: string
): Promise<{
  usd: number
  eur: number
}> => {
  try {
    return await cardApiManager.fetchCardPrice(cardName)
  } catch (error) {
    console.error('Erreur lors de la récupération du prix:', error)
    return { usd: 0, eur: 0 }
  }
}

/**
 * Récupère le prix d'une carte par son ID
 * Utilise le nouveau PricingService avec fallback automatique
 */
export const fetchCardPriceById = async (
  cardId: string
): Promise<{
  usd: number
  eur: number
}> => {
  try {
    // Pour l'instant, on utilise fetchCardPrice avec le nom de la carte
    // TODO: Implémenter fetchCardPriceById dans le CardApiManager
    return await cardApiManager.fetchCardPrice(cardId)
  } catch (error) {
    console.error('Erreur lors de la récupération du prix:', error)
    return { usd: 0, eur: 0 }
  }
}

/**
 * Récupère les prix de plusieurs cartes
 * Utilise le nouveau PricingService pour une meilleure performance
 */
export const fetchBulkCardPrices = async (
  cardNames: string[]
): Promise<
  Array<{
    cardName: string
    usd: number
    eur: number
  }>
> => {
  try {
    const results = await Promise.allSettled(
      cardNames.map(async cardName => {
        const price = await cardApiManager.fetchCardPrice(cardName)
        return {
          cardName,
          usd: price.usd,
          eur: price.eur,
        }
      })
    )

    return results
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === 'fulfilled'
      )
      .map(result => result.value)
  } catch (error) {
    console.error('Erreur lors de la récupération des prix en lot:', error)
    return []
  }
}

// Export des types pour compatibilité
export type { PriceData } from '@/card-api-service/dto'
