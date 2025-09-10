/**
 * Exemple d'intégration des nouveaux services dans l'application
 */

import { 
  CardServiceFactory,
  CacheService,
  RateLimitService,
  MonitoringService,
  ProviderSelectionStrategyFactory,
  FallbackService,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_MONITORING_CONFIG,
  DEFAULT_FALLBACK_CONFIG
} from '../index'

// ========================================
// 1. CONFIGURATION INITIALE
// ========================================

// Configuration des services
const cacheConfig = {
  enabled: true,
  ttl: 3600, // 1 heure
  provider: 'memory' as const,
  maxSize: 1000 // Ajout de la propriété manquante
}

const monitoringConfig = {
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

// ========================================
// 2. INITIALISATION DES SERVICES
// ========================================

// Services d'infrastructure
const cacheService = new CacheService(cacheConfig)
const rateLimitService = new RateLimitService(DEFAULT_RATE_LIMIT_CONFIG)
const monitoringService = new MonitoringService(monitoringConfig)

// Services principaux avec infrastructure
const cardService = CardServiceFactory.create({
  cache: cacheConfig,
  monitoring: monitoringConfig
})

// ========================================
// 3. UTILISATION DANS L'APPLICATION
// ========================================

export class CardApiManager {
  private cardService: any
  private cacheService: CacheService
  private rateLimitService: RateLimitService
  private monitoringService: MonitoringService

  constructor() {
    this.cacheService = cacheService
    this.rateLimitService = rateLimitService
    this.monitoringService = monitoringService
    this.cardService = cardService
  }

  /**
   * Récupère une carte avec monitoring et cache
   */
  async fetchCard(cardId: string) {
    const startTime = Date.now()
    
    try {
      // Vérifier le cache d'abord
      const cachedCard = await this.cacheService.getCard(cardId)
      if (cachedCard) {
        this.monitoringService.recordCacheHit('scryfall', 'card')
        return cachedCard
      }

      // Vérifier les limites de taux
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
   * Récupère les métriques de santé
   */
  async getHealthStatus() {
    return await this.monitoringService.getHealthStatus()
  }

  /**
   * Obtient les statistiques d'utilisation
   */
  getUsageStats() {
    return this.monitoringService.getStats()
  }

  /**
   * Obtient un rapport de santé formaté
   */
  async getHealthReport() {
    return await this.monitoringService.getHealthReport()
  }
}

// ========================================
// 4. EXEMPLE D'UTILISATION DANS UN COMPOSANT REACT
// ========================================

// Note: Ce code nécessite React et les hooks useState/useEffect
// Il est commenté car ce fichier est en TypeScript pur

/*
export const useCardApi = () => {
  const [cardManager] = useState(() => new CardApiManager())
  const [healthStatus, setHealthStatus] = useState(null)
  const [usageStats, setUsageStats] = useState(null)

  // Mise à jour périodique des métriques
  useEffect(() => {
    const updateMetrics = async () => {
      const health = await cardManager.getHealthStatus()
      const stats = cardManager.getUsageStats()
      
      setHealthStatus(health)
      setUsageStats(stats)
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 30000) // Toutes les 30 secondes

    return () => clearInterval(interval)
  }, [cardManager])

  return {
    fetchCard: cardManager.fetchCard.bind(cardManager),
    healthStatus,
    usageStats,
    getHealthReport: cardManager.getHealthReport.bind(cardManager)
  }
}
*/

// ========================================
// 5. EXEMPLE D'UTILISATION DANS UNE PAGE
// ========================================

// Note: Ce code JSX nécessite React
// Il est commenté car ce fichier est en TypeScript pur

/*
export const CardPage = () => {
  const { fetchCard, healthStatus, usageStats } = useCardApi()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFetchCard = async (cardId: string) => {
    setLoading(true)
    try {
      const cardData = await fetchCard(cardId)
      setCard(cardData)
    } catch (error) {
      console.error('Erreur lors de la récupération de la carte:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Card API Dashboard</h1>
      // ... reste du JSX
    </div>
  )
}
*/
