/**
 * Service Manager centralisé pour l'application Cardfolio
 * Utilise le nouveau Card API Service avec monitoring et cache
 */

import { 
  CardServiceFactory,
  CacheService,
  RateLimitService,
  MonitoringService,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_MONITORING_CONFIG
} from '@/card-api-service'

// Configuration pour l'application
const APP_CONFIG = {
  cache: {
    enabled: true,
    ttl: 3600, // 1 heure
    provider: 'memory' as const,
    maxSize: 1000
  },
  monitoring: {
    ...DEFAULT_MONITORING_CONFIG,
    enabled: true,
    logLevel: 'info' as const,
    metricsEnabled: true,
    metrics: {
      collectApiCalls: true,
      collectResponseTimes: true,
      collectErrorRates: true,
      collectCacheHitRates: true
    }
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
  private monitoringService: MonitoringService

  private constructor() {
    // Initialiser les services d'infrastructure
    this.cacheService = new CacheService(APP_CONFIG.cache)
    this.rateLimitService = new RateLimitService(DEFAULT_RATE_LIMIT_CONFIG)
    this.monitoringService = new MonitoringService(APP_CONFIG.monitoring)
    
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
  getMonitoringService() { return this.monitoringService }

  /**
   * Récupère une carte avec monitoring et cache
   */
  async fetchCard(cardId: string) {
    const startTime = Date.now()
    
    try {
      // Vérifier le cache
      const cachedCard = await this.cacheService.getCard(cardId)
      if (cachedCard) {
        this.monitoringService.recordCacheHit('scryfall', 'card')
        return cachedCard
      }

      // Attendre la disponibilité du rate limit
      await this.rateLimitService.waitForScryfallAvailability()

      // Récupérer la carte
      const card = await this.cardService.fetchCard({ cardId })
      
      // Mettre en cache
      await this.cacheService.setCard(cardId, card)
      this.monitoringService.recordCacheMiss('scryfall', 'card')

      // Enregistrer les métriques
      const responseTime = Date.now() - startTime
      this.monitoringService.recordApiCall(
        'scryfall',
        '/cards',
        'GET',
        responseTime,
        200,
        true
      )

      return card
    } catch (error) {
      // Enregistrer l'erreur
      const responseTime = Date.now() - startTime
      this.monitoringService.recordApiCall(
        'scryfall',
        '/cards',
        'GET',
        responseTime,
        500,
        false
      )
      throw error
    }
  }

  /**
   * Recherche des cartes avec monitoring et cache
   */
  async searchCards(query: string, options?: any) {
    const startTime = Date.now()
    
    try {
      // Vérifier le cache de recherche
      const cachedResults = await this.cacheService.getSearchResults(query, options)
      if (cachedResults) {
        this.monitoringService.recordCacheHit('scryfall', 'search')
        return cachedResults
      }

      // Attendre la disponibilité du rate limit
      await this.rateLimitService.waitForScryfallAvailability()

      // Rechercher les cartes
      const results = await this.cardService.searchCards({ query, options })
      
      // Mettre en cache
      await this.cacheService.setSearchResults(query, results, undefined, options)
      this.monitoringService.recordCacheMiss('scryfall', 'search')

      // Enregistrer les métriques
      const responseTime = Date.now() - startTime
      this.monitoringService.recordApiCall(
        'scryfall',
        '/cards/search',
        'GET',
        responseTime,
        200,
        true
      )

      return results
    } catch (error) {
      // Enregistrer l'erreur
      const responseTime = Date.now() - startTime
      this.monitoringService.recordApiCall(
        'scryfall',
        '/cards/search',
        'GET',
        responseTime,
        500,
        false
      )
      throw error
    }
  }

  /**
   * Récupère les sets avec monitoring et cache
   */
  async fetchSets() {
    const startTime = Date.now()
    
    try {
      // Vérifier le cache
      const cachedSets = await this.cacheService.getSets()
      if (cachedSets) {
        this.monitoringService.recordCacheHit('scryfall', 'sets')
        return cachedSets
      }

      // Attendre la disponibilité du rate limit
      await this.rateLimitService.waitForScryfallAvailability()

      // Récupérer les sets
      const sets = await this.cardService.fetchSets()
      
      // Mettre en cache
      await this.cacheService.setSets(sets)
      this.monitoringService.recordCacheMiss('scryfall', 'sets')

      // Enregistrer les métriques
      const responseTime = Date.now() - startTime
      this.monitoringService.recordApiCall(
        'scryfall',
        '/sets',
        'GET',
        responseTime,
        200,
        true
      )

      return sets
    } catch (error) {
      // Enregistrer l'erreur
      const responseTime = Date.now() - startTime
      this.monitoringService.recordApiCall(
        'scryfall',
        '/sets',
        'GET',
        responseTime,
        500,
        false
      )
      throw error
    }
  }

  /**
   * Récupère le prix d'une carte avec monitoring
   */
  async fetchCardPrice(cardName: string) {
    const startTime = Date.now()
    
    try {
      // Vérifier le cache de prix
      const cachedPrice = await this.cacheService.getPrice(cardName)
      if (cachedPrice) {
        this.monitoringService.recordCacheHit('scryfall', 'price')
        return cachedPrice
      }

      // Attendre la disponibilité du rate limit
      await this.rateLimitService.waitForScryfallAvailability()

      // Récupérer le prix
      const price = await this.pricingService.fetchSimplePrice(cardName)
      
      // Mettre en cache
      await this.cacheService.setPrice(cardName, price)
      this.monitoringService.recordCacheMiss('scryfall', 'price')

      // Enregistrer les métriques
      const responseTime = Date.now() - startTime
      this.monitoringService.recordApiCall(
        'scryfall',
        '/cards/named',
        'GET',
        responseTime,
        200,
        true
      )

      return price
    } catch (error) {
      // Enregistrer l'erreur
      const responseTime = Date.now() - startTime
      this.monitoringService.recordApiCall(
        'scryfall',
        '/cards/named',
        'GET',
        responseTime,
        500,
        false
      )
      throw error
    }
  }

  /**
   * Récupère les suggestions d'autocomplete
   */
  async getAutocompleteSuggestions(query: string) {
    const startTime = Date.now()
    
    try {
      // Attendre la disponibilité du rate limit
      await this.rateLimitService.waitForScryfallAvailability()

      // Récupérer les suggestions
      const suggestions = await this.cardService.getAutocompleteSuggestions(query)

      // Enregistrer les métriques
      const responseTime = Date.now() - startTime
      this.monitoringService.recordApiCall(
        'scryfall',
        '/cards/autocomplete',
        'GET',
        responseTime,
        200,
        true
      )

      return suggestions
    } catch (error) {
      // Enregistrer l'erreur
      const responseTime = Date.now() - startTime
      this.monitoringService.recordApiCall(
        'scryfall',
        '/cards/autocomplete',
        'GET',
        responseTime,
        500,
        false
      )
      throw error
    }
  }

  /**
   * Obtient les métriques de monitoring
   */
  getMonitoringStats() {
    return this.monitoringService.getStats()
  }

  /**
   * Obtient l'état de santé
   */
  async getHealthStatus() {
    return await this.monitoringService.getHealthStatus()
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
