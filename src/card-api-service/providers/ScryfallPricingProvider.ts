import axios, { type AxiosResponse } from 'axios'
import type { IPricingProvider } from '../interfaces'
import type { 
  PriceServiceResponseDTO,
  ServiceErrorDTO,
  ServiceMetadataDTO,
  ScryfallCardDTO
} from '../dto'

/**
 * Provider Scryfall pour les prix des cartes Magic: The Gathering
 * Implémente IPricingProvider pour récupérer les informations de prix
 */
export class ScryfallPricingProvider implements IPricingProvider {
  readonly name = 'scryfall-pricing'
  readonly baseUrl = 'https://api.scryfall.com'

  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.get(`${this.baseUrl}${endpoint}`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error: any) {
      throw new Error(`Scryfall Pricing API error: ${error.message}`)
    }
  }

  /**
   * Récupère le prix d'une carte par son ID
   */
  async fetchCardPrice(cardId: string): Promise<PriceServiceResponseDTO> {
    const startTime = Date.now()
    
    try {
      const rawCard = await this.makeRequest<ScryfallCardDTO>(`/cards/${cardId}`)
      
      return {
        data: this.transformPriceData(rawCard),
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      return {
        data: this.getEmptyPriceData(cardId),
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        },
        error: {
          code: 'SCRYFALL_PRICE_FETCH_ERROR',
          message: error.message,
          provider: this.name,
          retryable: true,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Récupère le prix d'une carte par son nom
   */
  async fetchCardPriceByName(cardName: string, setCode?: string): Promise<PriceServiceResponseDTO> {
    const startTime = Date.now()
    
    try {
      let endpoint: string
      
      if (setCode) {
        // Recherche par nom exact dans un set spécifique
        endpoint = `/cards/named?exact=${encodeURIComponent(cardName)}&set=${setCode}`
      } else {
        // Recherche par nom exact
        endpoint = `/cards/named?exact=${encodeURIComponent(cardName)}`
      }

      const rawCard = await this.makeRequest<ScryfallCardDTO>(endpoint)
      
      return {
        data: this.transformPriceData(rawCard),
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      return {
        data: this.getEmptyPriceData('', cardName),
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        },
        error: {
          code: 'SCRYFALL_PRICE_BY_NAME_ERROR',
          message: error.message,
          provider: this.name,
          retryable: true,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  /**
   * Récupère les prix de plusieurs cartes en une fois
   * Scryfall ne supporte pas le bulk pricing, donc on fait des requêtes individuelles
   */
  async fetchBulkPrices(cardIds: string[]): Promise<PriceServiceResponseDTO[]> {
    const startTime = Date.now()
    
    try {
      // Scryfall ne supporte pas le bulk pricing, on fait des requêtes parallèles
      const promises = cardIds.map(cardId => this.fetchCardPrice(cardId))
      const results = await Promise.allSettled(promises)
      
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          return {
            data: this.getEmptyPriceData(cardIds[index]),
            metadata: {
              provider: this.name,
              cached: false,
              fetchTime: Date.now() - startTime,
              timestamp: new Date().toISOString()
            },
            error: {
              code: 'SCRYFALL_BULK_PRICE_ERROR',
              message: result.reason?.message || 'Unknown error',
              provider: this.name,
              retryable: true,
              timestamp: new Date().toISOString()
            }
          }
        }
      })
    } catch (error: any) {
      return cardIds.map(cardId => ({
        data: this.getEmptyPriceData(cardId),
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        },
        error: {
          code: 'SCRYFALL_BULK_PRICE_ERROR',
          message: error.message,
          provider: this.name,
          retryable: true,
          timestamp: new Date().toISOString()
        }
      }))
    }
  }

  /**
   * Récupère l'historique des prix d'une carte
   * Scryfall ne fournit pas d'historique des prix, on retourne le prix actuel
   */
  async fetchPriceHistory(cardId: string, period?: string): Promise<PriceServiceResponseDTO> {
    // Scryfall ne fournit pas d'historique des prix
    // On retourne le prix actuel avec une note
    const currentPrice = await this.fetchCardPrice(cardId)
    
    if (currentPrice.data) {
      // Scryfall ne fournit pas d'historique des prix, on retourne le prix actuel
      console.warn('Scryfall does not provide price history. Current price returned.')
    }
    
    return currentPrice
  }

  /**
   * Vérifie si le provider est disponible
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.makeRequest('/sets')
      return true
    } catch {
      return false
    }
  }

  /**
   * Transforme les données brutes de Scryfall en format PriceData
   */
  private transformPriceData(rawCard: ScryfallCardDTO) {
    return {
      cardId: rawCard.id,
      cardName: rawCard.name,
      setCode: rawCard.set,
      prices: {
        usd: rawCard.prices?.usd ? parseFloat(rawCard.prices.usd) : undefined,
        eur: rawCard.prices?.eur ? parseFloat(rawCard.prices.eur) : undefined,
        tix: rawCard.prices?.tix ? parseFloat(rawCard.prices.tix) : undefined
      },
      lastUpdated: new Date().toISOString(),
      source: this.name,
      marketPrice: {
        usd: rawCard.prices?.usd_foil ? parseFloat(rawCard.prices.usd_foil) : undefined,
        eur: rawCard.prices?.eur_foil ? parseFloat(rawCard.prices.eur_foil) : undefined
      },
      foilPrice: {
        usd: rawCard.prices?.usd_foil ? parseFloat(rawCard.prices.usd_foil) : undefined,
        eur: rawCard.prices?.eur_foil ? parseFloat(rawCard.prices.eur_foil) : undefined
      }
    }
  }

  /**
   * Retourne des données de prix vides en cas d'erreur
   */
  private getEmptyPriceData(cardId: string, cardName?: string) {
    return {
      cardId,
      cardName: cardName || '',
      prices: {
        usd: 0,
        eur: 0,
        tix: 0
      },
      lastUpdated: new Date().toISOString(),
      source: this.name
    }
  }
}
