import type { ICardProvider, ICardAdapter } from '../interfaces'
import type { 
  CardFetchRequestDTO, 
  SetFetchRequestDTO,
  SearchRequestDTO,
  BulkFetchRequestDTO,
  CardServiceResponseDTO,
  SetServiceResponseDTO,
  BulkCardResponseDTO,
  GameSet
} from '../dto'
import type { MTGCard } from '@/types/games/magic'
import type { ServiceConfig } from '../config'

/**
 * Service principal pour la gestion des cartes
 * Fournit une interface unifiée pour tous les providers
 */
export class CardService {
  private providers: Map<string, ICardProvider> = new Map()
  private adapters: Map<string, ICardAdapter> = new Map()
  private config: ServiceConfig
  private defaultProvider: string

  constructor(providers: Map<string, ICardProvider>, adapters: Map<string, ICardAdapter>, config: ServiceConfig) {
    this.providers = providers
    this.adapters = adapters
    this.config = config
    this.defaultProvider = config.defaultProvider
  }

  /**
   * Récupère une carte par son ID ou nom
   */
  async fetchCard(request: CardFetchRequestDTO): Promise<MTGCard> {
    const providerName = request.provider || this.defaultProvider
    const provider = this.providers.get(providerName)
    const adapter = this.adapters.get(providerName)

    if (!provider || !adapter) {
      throw new Error(`Provider or adapter not found: ${providerName}`)
    }

    try {
      const response = await provider.fetchCard(request)
      
      if (response.error) {
        // Tentative de fallback si configuré
        if (this.config.fallbackProviders.length > 0) {
          return this.fetchCardWithFallback(request)
        }
        throw new Error(response.error.message)
      }

      return adapter.transformCard(response.data)
    } catch (error) {
      // Fallback automatique
      if (this.config.fallbackProviders.length > 0) {
        return this.fetchCardWithFallback(request)
      }
      throw error
    }
  }

  /**
   * Récupère une carte par son nom
   */
  async fetchCardByName(cardName: string, options?: any): Promise<MTGCard> {
    return this.fetchCard({ cardName, options })
  }

  /**
   * Recherche des cartes
   */
  async searchCards(request: SearchRequestDTO): Promise<MTGCard[]> {
    const providerName = request.provider || this.defaultProvider
    const provider = this.providers.get(providerName)
    const adapter = this.adapters.get(providerName)

    if (!provider || !adapter) {
      throw new Error(`Provider or adapter not found: ${providerName}`)
    }

    try {
      const responses = await provider.searchCards(request.query, request.options)
      
      return responses
        .filter(response => !response.error)
        .map(response => adapter.transformCard(response.data))
    } catch (error) {
      // Fallback vers un autre provider
      if (this.config.fallbackProviders.length > 0) {
        return this.searchCardsWithFallback(request)
      }
      throw error
    }
  }

  /**
   * Récupère toutes les cartes d'un set
   */
  async fetchSetCards(request: SetFetchRequestDTO): Promise<MTGCard[]> {
    const providerName = request.provider || this.defaultProvider
    const provider = this.providers.get(providerName)
    const adapter = this.adapters.get(providerName)

    if (!provider || !adapter) {
      throw new Error(`Provider or adapter not found: ${providerName}`)
    }

    const allCards: MTGCard[] = []
    let hasMore = true
    let nextPage: string | undefined

    try {
      while (hasMore) {
        const result = await provider.fetchSetCards(request)
        
        if (result.error) {
          throw new Error(result.error.message)
        }

        const cards = adapter.transformCards(result.data as any)
        allCards.push(...cards)
        
        // Vérifier s'il y a plus de pages
        hasMore = (result.data as any).has_more || false
        nextPage = (result.data as any).next_page

        // Délai entre les requêtes si configuré
        if (hasMore && request.options?.delayBetweenPages) {
          const delay = request.options.delayBetweenPages
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      return allCards
    } catch (error) {
      // Fallback vers un autre provider
      if (this.config.fallbackProviders.length > 0) {
        return this.fetchSetCardsWithFallback(request)
      }
      throw error
    }
  }

  /**
   * Récupère la suite des cartes (pagination)
   */
  async fetchMoreCards(nextPageUrl: string, providerName?: string): Promise<MTGCard[]> {
    const provider = this.providers.get(providerName || this.defaultProvider)
    const adapter = this.adapters.get(providerName || this.defaultProvider)

    if (!provider || !adapter) {
      throw new Error(`Provider or adapter not found: ${providerName || this.defaultProvider}`)
    }

    try {
      const result = await provider.fetchMoreCards(nextPageUrl)
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      return adapter.transformCards(result.data as any)
    } catch (error) {
      throw error
    }
  }

  /**
   * Récupère tous les sets disponibles
   * TODO: Implémenter fetchSets dans ICardProvider
   */
  async fetchSets(providerName?: string): Promise<GameSet[]> {
    // Pour l'instant, on utilise l'ancien système
    // TODO: Implémenter fetchSets dans ICardProvider
    throw new Error('fetchSets not yet implemented in CardService')
  }

  /**
   * Récupère plusieurs cartes en lot
   */
  async fetchBulkCards(request: BulkFetchRequestDTO): Promise<BulkCardResponseDTO> {
    const providerName = request.provider || this.defaultProvider
    const provider = this.providers.get(providerName)
    const adapter = this.adapters.get(providerName)

    if (!provider || !adapter) {
      throw new Error(`Provider or adapter not found: ${providerName}`)
    }

    const cards: MTGCard[] = []
    const errors: Array<{ cardId: string; error: any }> = []
    const batchSize = request.options?.batchSize || 10
    const delayBetweenBatches = request.options?.delayBetweenBatches || 1000

    // Traitement par lots
    for (let i = 0; i < request.cardIds.length; i += batchSize) {
      const batch = request.cardIds.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (cardId) => {
        try {
          const card = await this.fetchCard({ cardId, provider: providerName })
          return { success: true, card, cardId }
        } catch (error) {
          return { success: false, error, cardId }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      
      batchResults.forEach(result => {
        if (result.success && result.card) {
          cards.push(result.card)
        } else {
          errors.push({ cardId: result.cardId, error: result.error })
        }
      })

      // Délai entre les lots
      if (i + batchSize < request.cardIds.length && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
      }
    }

    return {
      cards,
      errors,
      metadata: {
        provider: providerName,
        cached: false,
        fetchTime: 0,
        timestamp: new Date().toISOString(),
        totalRequested: request.cardIds.length,
        totalSuccessful: cards.length,
        totalFailed: errors.length,
        providers: [providerName]
      }
    }
  }

  // Méthodes de fallback privées
  private async fetchCardWithFallback(request: CardFetchRequestDTO): Promise<MTGCard> {
    for (const fallbackProvider of this.config.fallbackProviders) {
      try {
        return await this.fetchCard({ ...request, provider: fallbackProvider })
      } catch (error) {
        console.warn(`Fallback provider ${fallbackProvider} failed:`, error)
        continue
      }
    }
    throw new Error('All providers failed')
  }

  private async searchCardsWithFallback(request: SearchRequestDTO): Promise<MTGCard[]> {
    for (const fallbackProvider of this.config.fallbackProviders) {
      try {
        return await this.searchCards({ ...request, provider: fallbackProvider })
      } catch (error) {
        console.warn(`Fallback provider ${fallbackProvider} failed:`, error)
        continue
      }
    }
    throw new Error('All providers failed')
  }

  private async fetchSetCardsWithFallback(request: SetFetchRequestDTO): Promise<MTGCard[]> {
    for (const fallbackProvider of this.config.fallbackProviders) {
      try {
        return await this.fetchSetCards({ ...request, provider: fallbackProvider })
      } catch (error) {
        console.warn(`Fallback provider ${fallbackProvider} failed:`, error)
        continue
      }
    }
    throw new Error('All providers failed')
  }

  private async fetchSetsWithFallback(providerName?: string): Promise<GameSet[]> {
    for (const fallbackProvider of this.config.fallbackProviders) {
      try {
        return await this.fetchSets(fallbackProvider)
      } catch (error) {
        console.warn(`Fallback provider ${fallbackProvider} failed:`, error)
        continue
      }
    }
    throw new Error('All providers failed')
  }
}
