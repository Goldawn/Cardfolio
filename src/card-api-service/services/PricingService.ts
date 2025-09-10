import type { IPricingProvider } from '../interfaces'
import type { 
  PriceServiceResponseDTO,
  PriceData
} from '../dto'
import type { ServiceConfig } from '../config'
import { DEFAULT_SERVICE_CONFIG } from '../config'
import { ScryfallPricingProvider } from '../providers/ScryfallPricingProvider'
import { ScryfallAdapter } from '../adapters/ScryfallAdapter'

/**
 * Service principal pour la gestion des prix des cartes
 * Utilise le pattern Facade pour fournir une interface unifiée
 */
export class PricingService {
  private providers: Map<string, IPricingProvider> = new Map()
  private defaultProvider: string
  private adapter: ScryfallAdapter

  constructor(config?: Partial<ServiceConfig>) {
    // Utiliser la configuration fournie ou la configuration par défaut
    const finalConfig = { ...DEFAULT_SERVICE_CONFIG, ...config }
    this.defaultProvider = finalConfig.defaultProvider
    this.adapter = new ScryfallAdapter()
    
    // Initialisation des providers
    this.initializeProviders(finalConfig)
  }

  /**
   * Initialise les providers disponibles
   */
  private initializeProviders(config: ServiceConfig) {
    // Provider Scryfall pour les prix
    if (config.providers.scryfall?.enabled) {
      const scryfallPricingProvider = new ScryfallPricingProvider()
      this.providers.set('scryfall', scryfallPricingProvider)
    }

    // TODO: Ajouter d'autres providers (MTGGoldfish, TCGPlayer, etc.)
  }

  /**
   * Récupère le prix d'une carte par son ID
   */
  async fetchCardPrice(cardId: string, providerName?: string): Promise<PriceData | null> {
    try {
      const provider = this.getProvider(providerName)
      const response = await provider.fetchCardPrice(cardId)
      
      if (response.error) {
        console.error('Erreur lors de la récupération du prix:', response.error)
        return null
      }

      return response.data
    } catch (error) {
      console.error('Erreur dans PricingService.fetchCardPrice:', error)
      return null
    }
  }

  /**
   * Récupère le prix d'une carte par son nom
   */
  async fetchCardPriceByName(cardName: string, setCode?: string, providerName?: string): Promise<PriceData | null> {
    try {
      console.log(`[PricingService] fetchCardPriceByName called with: cardName=${cardName}, setCode=${setCode}, providerName=${providerName}`)
      const provider = this.getProvider(providerName)
      console.log(`[PricingService] Using provider:`, provider.name)
      const response = await provider.fetchCardPriceByName(cardName, setCode)
      
      if (response.error) {
        console.error('[PricingService] Erreur lors de la récupération du prix par nom:', response.error)
        return null
      }

      console.log(`[PricingService] Provider response:`, response)
      return response.data
    } catch (error) {
      console.error('[PricingService] Erreur dans PricingService.fetchCardPriceByName:', error)
      return null
    }
  }

  /**
   * Récupère les prix de plusieurs cartes
   */
  async fetchBulkPrices(cardIds: string[], providerName?: string): Promise<PriceData[]> {
    try {
      const provider = this.getProvider(providerName)
      const responses = await provider.fetchBulkPrices(cardIds)
      
      return responses
        .filter(response => !response.error)
        .map(response => response.data)
    } catch (error) {
      console.error('Erreur dans PricingService.fetchBulkPrices:', error)
      return []
    }
  }

  /**
   * Récupère l'historique des prix d'une carte
   */
  async fetchPriceHistory(cardId: string, period?: string, providerName?: string): Promise<PriceData | null> {
    try {
      const provider = this.getProvider(providerName)
      const response = await provider.fetchPriceHistory(cardId, period)
      
      if (response.error) {
        console.error('Erreur lors de la récupération de l\'historique des prix:', response.error)
        return null
      }

      return response.data
    } catch (error) {
      console.error('Erreur dans PricingService.fetchPriceHistory:', error)
      return null
    }
  }

  /**
   * Récupère le prix d'une carte avec fallback automatique
   */
  async fetchCardPriceWithFallback(cardId: string): Promise<PriceData | null> {
    const providers = Array.from(this.providers.keys())
    
    for (const providerName of providers) {
      try {
        const price = await this.fetchCardPrice(cardId, providerName)
        if (price && (price.prices.usd || price.prices.eur)) {
          return price
        }
      } catch (error) {
        console.warn(`Provider ${providerName} failed, trying next...`, error)
        continue
      }
    }
    
    console.error('Tous les providers ont échoué pour récupérer le prix')
    return null
  }

  /**
   * Récupère le prix d'une carte par nom avec fallback automatique
   */
  async fetchCardPriceByNameWithFallback(cardName: string, setCode?: string): Promise<PriceData | null> {
    const providers = Array.from(this.providers.keys())
    console.log(`[PricingService] fetchCardPriceByNameWithFallback called for card: ${cardName}`)
    console.log(`[PricingService] Available providers:`, providers)
    console.log(`[PricingService] Default provider:`, this.defaultProvider)
    
    for (const providerName of providers) {
      try {
        console.log(`[PricingService] Trying provider: ${providerName}`)
        const price = await this.fetchCardPriceByName(cardName, setCode, providerName)
        if (price && (price.prices.usd || price.prices.eur)) {
          console.log(`[PricingService] Success with provider ${providerName}:`, price)
          return price
        }
        console.log(`[PricingService] Provider ${providerName} returned no valid price:`, price)
      } catch (error) {
        console.warn(`[PricingService] Provider ${providerName} failed, trying next...`, error)
        continue
      }
    }
    
    console.error('[PricingService] Tous les providers ont échoué pour récupérer le prix par nom')
    return null
  }

  /**
   * Vérifie la santé de tous les providers
   */
  async checkProvidersHealth(): Promise<Record<string, boolean>> {
    const healthStatus: Record<string, boolean> = {}
    
    for (const [name, provider] of this.providers) {
      try {
        healthStatus[name] = await provider.isHealthy()
      } catch (error) {
        healthStatus[name] = false
      }
    }
    
    return healthStatus
  }

  /**
   * Retourne la liste des providers disponibles
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Retourne le provider par défaut
   */
  getDefaultProvider(): string {
    return this.defaultProvider
  }

  /**
   * Récupère un provider par son nom
   */
  private getProvider(providerName?: string): IPricingProvider {
    const name = providerName || this.defaultProvider
    const provider = this.providers.get(name)
    
    if (!provider) {
      throw new Error(`Provider '${name}' not found. Available providers: ${Array.from(this.providers.keys()).join(', ')}`)
    }
    
    return provider
  }

  /**
   * Méthode de compatibilité avec l'ancienne API
   * Retourne un format simple { usd: number, eur: number }
   */
  async fetchSimplePrice(cardName: string): Promise<{ usd: number; eur: number }> {
    try {
      const priceData = await this.fetchCardPriceByNameWithFallback(cardName)
      
      if (!priceData) {
        return { usd: 0, eur: 0 }
      }

      return {
        usd: priceData.prices.usd || 0,
        eur: priceData.prices.eur || 0
      }
    } catch (error) {
      console.error('Erreur dans fetchSimplePrice:', error)
      return { usd: 0, eur: 0 }
    }
  }

  /**
   * Méthode de compatibilité avec l'ancienne API
   * Retourne un format simple { usd: number, eur: number } par ID
   */
  async fetchSimplePriceById(cardId: string): Promise<{ usd: number; eur: number }> {
    try {
      const priceData = await this.fetchCardPriceWithFallback(cardId)
      
      if (!priceData) {
        return { usd: 0, eur: 0 }
      }

      return {
        usd: priceData.prices.usd || 0,
        eur: priceData.prices.eur || 0
      }
    } catch (error) {
      console.error('Erreur dans fetchSimplePriceById:', error)
      return { usd: 0, eur: 0 }
    }
  }
}
