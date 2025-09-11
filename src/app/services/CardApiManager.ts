/**
 * Service Manager centralisé pour l'application Cardfolio
 * Utilise le nouveau Card API Service avec cache et rate limiting
 */

import { 
  CardServiceFactory,
  CacheService,
  RateLimitService,
  DEFAULT_RATE_LIMIT_CONFIG
} from '@/card-api-service'

// Configuration pour l'application
const APP_CONFIG = {
  cache: {
    enabled: true,
    ttl: 3600, // 1 heure
    provider: 'memory' as const,
    maxSize: 1000
  }
}

/**
 * Service Manager singleton pour l'application
 */
class CardApiManager {
  private static instance: CardApiManager
  private cardService: any
  private pricingService: any
  private cacheService: CacheService
  private rateLimitService: RateLimitService

  private constructor() {
    // Initialiser les services d'infrastructure
    this.cacheService = new CacheService(APP_CONFIG.cache)
    this.rateLimitService = new RateLimitService(DEFAULT_RATE_LIMIT_CONFIG)
    
    // Créer les services principaux
    this.cardService = CardServiceFactory.create(APP_CONFIG)
    this.pricingService = CardServiceFactory.createPricingService()
  }

  static getInstance(): CardApiManager {
    if (!CardApiManager.instance) {
      CardApiManager.instance = new CardApiManager()
    }
    return CardApiManager.instance
  }

  // Getters pour les services
  getCardService() { return this.cardService }
  getPricingService() { return this.pricingService }
  getCacheService() { return this.cacheService }
  getRateLimitService() { return this.rateLimitService }

  /**
   * Récupère une carte avec cache et rate limiting
   */
  async fetchCard(cardId: string) {
    try {
      // Vérifier le cache
      const cachedCard = await this.cacheService.getCard(cardId)
      if (cachedCard) {
        return cachedCard
      }

      // Attendre la disponibilité du rate limit
      await this.rateLimitService.waitForScryfallAvailability()

      // Récupérer la carte
      const card = await this.cardService.fetchCard({ cardId })
      
      // Mettre en cache
      await this.cacheService.setCard(cardId, card)

      return card
    } catch (error) {
      throw error
    }
  }

  /**
   * Recherche des cartes avec cache et rate limiting
   */
  async searchCards(query: string, options?: any) {
    try {
      // Vérifier le cache de recherche
      const cachedResults = await this.cacheService.getSearchResults(query, options)
      if (cachedResults) {
        return cachedResults
      }

      // Attendre la disponibilité du rate limit
      await this.rateLimitService.waitForScryfallAvailability()

      // Rechercher les cartes
      const results = await this.cardService.searchCards({ query, options })
      
      // Mettre en cache
      await this.cacheService.setSearchResults(query, results, undefined, options)

      return results
    } catch (error) {
      throw error
    }
  }

  /**
   * Récupère les sets avec cache et rate limiting
   */
  async fetchSets() {
    try {
      // Vérifier le cache
      const cachedSets = await this.cacheService.getSets()
      if (cachedSets) {
        return cachedSets
      }

      // Attendre la disponibilité du rate limit
      await this.rateLimitService.waitForScryfallAvailability()

      // Récupérer les sets
      const sets = await this.cardService.fetchSets()
      
      // Mettre en cache
      await this.cacheService.setSets(sets)

      return sets
    } catch (error) {
      throw error
    }
  }

  /**
   * Récupère le prix d'une carte avec cache et rate limiting
   */
  async fetchCardPrice(cardName: string) {
    try {
      // Vérifier le cache de prix
      const cachedPrice = await this.cacheService.getPrice(cardName)
      if (cachedPrice) {
        return cachedPrice
      }

      // Attendre la disponibilité du rate limit
      await this.rateLimitService.waitForScryfallAvailability()

      // Récupérer le prix
      const price = await this.pricingService.fetchSimplePrice(cardName)
      
      // Mettre en cache
      await this.cacheService.setPrice(cardName, price)

      return price
    } catch (error) {
      throw error
    }
  }

  /**
   * Récupère les suggestions d'autocomplete
   */
  async getAutocompleteSuggestions(query: string) {
    try {
      // Attendre la disponibilité du rate limit
      await this.rateLimitService.waitForScryfallAvailability()

      // Récupérer les suggestions
      const suggestions = await this.cardService.getAutocompleteSuggestions(query)

      return suggestions
    } catch (error) {
      throw error
    }
  }

  /**
   * Vide le cache
   */
  async clearCache() {
    await this.cacheService.clear()
  }
}

// Export de l'instance singleton
export const cardApiManager = CardApiManager.getInstance()

// Export des méthodes pour compatibilité avec l'ancien code
export const fetchCard = (cardId: string) => cardApiManager.fetchCard(cardId)
export const searchCards = (query: string, options?: any) => cardApiManager.searchCards(query, options)
export const fetchSets = () => cardApiManager.fetchSets()
export const fetchCardPrice = (cardName: string) => cardApiManager.fetchCardPrice(cardName)
export const getAutocompleteSuggestions = (query: string) => cardApiManager.getAutocompleteSuggestions(query)

// Export du manager pour utilisation avancée
export default cardApiManager
