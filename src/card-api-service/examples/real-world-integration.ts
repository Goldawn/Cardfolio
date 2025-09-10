/**
 * Exemple d'intégration réelle dans l'application Cardfolio
 */

import { 
  CardServiceFactory,
  CacheService,
  RateLimitService,
  MonitoringService,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_MONITORING_CONFIG
} from '../index'

// ========================================
// 1. CONFIGURATION POUR L'APPLICATION
// ========================================

const CARD_API_CONFIG = {
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

// ========================================
// 2. SERVICE MANAGER GLOBAL
// ========================================

class CardApiServiceManager {
  private static instance: CardApiServiceManager
  private cardService: any
  private cacheService: CacheService
  private rateLimitService: RateLimitService
  private monitoringService: MonitoringService

  private constructor() {
    // Initialiser les services
    this.cacheService = new CacheService(CARD_API_CONFIG.cache)
    this.rateLimitService = new RateLimitService(DEFAULT_RATE_LIMIT_CONFIG)
    this.monitoringService = new MonitoringService(CARD_API_CONFIG.monitoring)
    
    // Créer le service principal avec configuration
    this.cardService = CardServiceFactory.create(CARD_API_CONFIG)
  }

  static getInstance(): CardApiServiceManager {
    if (!CardApiServiceManager.instance) {
      CardApiServiceManager.instance = new CardApiServiceManager()
    }
    return CardApiServiceManager.instance
  }

  // Méthodes publiques
  getCardService() { return this.cardService }
  getCacheService() { return this.cacheService }
  getRateLimitService() { return this.rateLimitService }
  getMonitoringService() { return this.monitoringService }
}

// ========================================
// 3. HOOK REACT POUR L'UTILISATION
// ========================================

// Note: Ce code nécessite React et les hooks useState/useEffect
// Il est commenté car ce fichier est en TypeScript pur

/*
export const useCardApi = () => {
  const serviceManager = CardApiServiceManager.getInstance()
  
  const [healthStatus, setHealthStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Mise à jour périodique de la santé
  useEffect(() => {
    const updateHealth = async () => {
      try {
        const health = await serviceManager.getMonitoringService().getHealthStatus()
        setHealthStatus(health)
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la santé:', error)
      }
    }

    updateHealth()
    const interval = setInterval(updateHealth, 60000) // Toutes les minutes

    return () => clearInterval(interval)
  }, [])

  const fetchCard = async (cardId: string) => {
    setIsLoading(true)
    const startTime = Date.now()
    
    try {
      // Vérifier le cache
      const cachedCard = await serviceManager.getCacheService().getCard(cardId)
      if (cachedCard) {
        serviceManager.getMonitoringService().recordCacheHit('scryfall', 'card')
        setIsLoading(false)
        return cachedCard
      }

      // Attendre la disponibilité du rate limit
      await serviceManager.getRateLimitService().waitForScryfallAvailability()

      // Récupérer la carte
      const card = await serviceManager.getCardService().fetchCard({ cardId })
      
      // Mettre en cache
      await serviceManager.getCacheService().setCard(cardId, card)
      serviceManager.getMonitoringService().recordCacheMiss('scryfall', 'card')

      // Enregistrer les métriques
      const responseTime = Date.now() - startTime
      serviceManager.getMonitoringService().recordApiCall(
        'scryfall',
        '/cards',
        'GET',
        responseTime,
        200,
        true
      )

      setIsLoading(false)
      return card
    } catch (error) {
      // Enregistrer l'erreur
      const responseTime = Date.now() - startTime
      serviceManager.getMonitoringService().recordApiCall(
        'scryfall',
        '/cards',
        'GET',
        responseTime,
        500,
        false
      )
      
      setIsLoading(false)
      throw error
    }
  }

  // ... autres méthodes

  return {
    fetchCard,
    searchCards,
    isLoading,
    healthStatus,
    getMonitoringStats,
    getHealthReport
  }
}
*/

// ========================================
// 4. COMPOSANT DE MONITORING POUR L'ADMIN
// ========================================

// Note: Ce code JSX nécessite React
// Il est commenté car ce fichier est en TypeScript pur

/*
export const AdminMonitoringPanel = () => {
  const { healthStatus, getMonitoringStats, getHealthReport } = useCardApi()
  const [stats, setStats] = useState(null)
  const [report, setReport] = useState('')

  useEffect(() => {
    const updateStats = () => {
      setStats(getMonitoringStats())
    }

    updateStats()
    const interval = setInterval(updateStats, 30000) // Toutes les 30 secondes

    return () => clearInterval(interval)
  }, [getMonitoringStats])

  const handleGenerateReport = async () => {
    try {
      const healthReport = await getHealthReport()
      setReport(healthReport)
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
    }
  }

  return (
    <div className="admin-monitoring-panel">
      <h2>Monitoring Card API Service</h2>
      // ... reste du JSX
    </div>
  )
}
*/

// ========================================
// 5. INTÉGRATION DANS UN COMPOSANT EXISTANT
// ========================================

// Note: Ce code JSX nécessite React
// Il est commenté car ce fichier est en TypeScript pur

/*
export const EnhancedCardSearch = () => {
  const { searchCards, isLoading, healthStatus } = useCardApi()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)

  const handleSearch = async () => {
    if (!query.trim()) return
    
    setError(null)
    try {
      const searchResults = await searchCards(query)
      setResults(searchResults)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="enhanced-card-search">
      // ... reste du JSX
    </div>
  )
}
*/

// ========================================
// 6. API ROUTES POUR LE MONITORING
// ========================================

// pages/api/card-api/health.ts
export const healthApiRoute = async (req: any, res: any) => {
  const serviceManager = CardApiServiceManager.getInstance()
  
  try {
    const health = await serviceManager.getMonitoringService().getHealthStatus()
    res.status(200).json(health)
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération de la santé' })
  }
}

// pages/api/card-api/metrics.ts
export const metricsApiRoute = async (req: any, res: any) => {
  const serviceManager = CardApiServiceManager.getInstance()
  
  try {
    const stats = serviceManager.getMonitoringService().getStats()
    res.status(200).json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des métriques' })
  }
}

// pages/api/card-api/cache/clear.ts
export const clearCacheApiRoute = async (req: any, res: any) => {
  const serviceManager = CardApiServiceManager.getInstance()
  
  try {
    await serviceManager.getCacheService().clear()
    res.status(200).json({ message: 'Cache vidé avec succès' })
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors du vidage du cache' })
  }
}
