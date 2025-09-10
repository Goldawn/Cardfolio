/**
 * Service de monitoring pour le Card API Service
 * Collecte des métriques et fournit des informations de santé
 */

export interface MonitoringConfig {
  enabled: boolean
  metrics: {
    collectApiCalls: boolean
    collectResponseTimes: boolean
    collectErrorRates: boolean
    collectCacheHitRates: boolean
  }
  healthChecks: {
    enabled: boolean
    interval: number // en millisecondes
  }
  alerts?: {
    enabled: boolean
    errorRateThreshold: number // pourcentage
    responseTimeThreshold: number // en millisecondes
  }
}

export interface MetricData {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: number
  services: Record<string, {
    status: 'healthy' | 'degraded' | 'unhealthy'
    responseTime?: number
    errorRate?: number
    lastCheck: number
  }>
  metrics: {
    totalRequests: number
    totalErrors: number
    averageResponseTime: number
    cacheHitRate: number
  }
}

export interface ApiCallMetric {
  provider: string
  endpoint: string
  method: string
  responseTime: number
  statusCode: number
  success: boolean
  timestamp: number
}

/**
 * Collecteur de métriques en mémoire
 */
class MetricsCollector {
  private metrics: MetricData[] = []
  private apiCalls: ApiCallMetric[] = []
  private maxMetrics = 10000 // Limite pour éviter la surcharge mémoire

  /**
   * Ajoute une métrique
   */
  addMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags
    }
    
    this.metrics.push(metric)
    
    // Nettoyer les anciennes métriques si nécessaire
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  /**
   * Enregistre un appel API
   */
  recordApiCall(metric: ApiCallMetric): void {
    this.apiCalls.push(metric)
    
    // Nettoyer les anciens appels si nécessaire
    if (this.apiCalls.length > this.maxMetrics) {
      this.apiCalls = this.apiCalls.slice(-this.maxMetrics)
    }
  }

  /**
   * Obtient les métriques par nom
   */
  getMetrics(name: string, timeRange?: { start: number; end: number }): MetricData[] {
    let filtered = this.metrics.filter(m => m.name === name)
    
    if (timeRange) {
      filtered = filtered.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      )
    }
    
    return filtered
  }

  /**
   * Obtient les appels API
   */
  getApiCalls(timeRange?: { start: number; end: number }): ApiCallMetric[] {
    let filtered = this.apiCalls
    
    if (timeRange) {
      filtered = filtered.filter(call => 
        call.timestamp >= timeRange.start && call.timestamp <= timeRange.end
      )
    }
    
    return filtered
  }

  /**
   * Calcule les statistiques
   */
  getStats(timeRange?: { start: number; end: number }): {
    totalRequests: number
    totalErrors: number
    averageResponseTime: number
    errorRate: number
    requestsByProvider: Record<string, number>
    requestsByEndpoint: Record<string, number>
  } {
    const calls = this.getApiCalls(timeRange)
    
    const totalRequests = calls.length
    const totalErrors = calls.filter(call => !call.success).length
    const averageResponseTime = calls.length > 0 
      ? calls.reduce((sum, call) => sum + call.responseTime, 0) / calls.length 
      : 0
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
    
    const requestsByProvider: Record<string, number> = {}
    const requestsByEndpoint: Record<string, number> = {}
    
    calls.forEach(call => {
      requestsByProvider[call.provider] = (requestsByProvider[call.provider] || 0) + 1
      requestsByEndpoint[call.endpoint] = (requestsByEndpoint[call.endpoint] || 0) + 1
    })
    
    return {
      totalRequests,
      totalErrors,
      averageResponseTime,
      errorRate,
      requestsByProvider,
      requestsByEndpoint
    }
  }

  /**
   * Nettoie les anciennes données
   */
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void { // 24 heures par défaut
    const cutoff = Date.now() - maxAge
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    this.apiCalls = this.apiCalls.filter(call => call.timestamp > cutoff)
  }
}

/**
 * Service de monitoring principal
 */
export class MonitoringService {
  private config: MonitoringConfig
  private collector: MetricsCollector
  private healthCheckInterval?: NodeJS.Timeout
  private providers: Map<string, any> = new Map()

  constructor(config: MonitoringConfig) {
    this.config = config
    this.collector = new MetricsCollector()
    
    if (config.healthChecks.enabled) {
      this.startHealthChecks()
    }
  }

  /**
   * Enregistre un appel API
   */
  recordApiCall(
    provider: string,
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    success: boolean
  ): void {
    if (!this.config.enabled || !this.config.metrics.collectApiCalls) {
      return
    }

    const metric: ApiCallMetric = {
      provider,
      endpoint,
      method,
      responseTime,
      statusCode,
      success,
      timestamp: Date.now()
    }

    this.collector.recordApiCall(metric)

    // Enregistrer des métriques détaillées
    if (this.config.metrics.collectResponseTimes) {
      this.collector.addMetric('api_response_time', responseTime, {
        provider,
        endpoint,
        method
      })
    }

    if (this.config.metrics.collectErrorRates) {
      this.collector.addMetric('api_success', success ? 1 : 0, {
        provider,
        endpoint
      })
    }
  }

  /**
   * Enregistre un hit de cache
   */
  recordCacheHit(provider: string, cacheType: string): void {
    if (!this.config.enabled || !this.config.metrics.collectCacheHitRates) {
      return
    }

    this.collector.addMetric('cache_hit', 1, {
      provider,
      cache_type: cacheType
    })
  }

  /**
   * Enregistre un miss de cache
   */
  recordCacheMiss(provider: string, cacheType: string): void {
    if (!this.config.enabled || !this.config.metrics.collectCacheHitRates) {
      return
    }

    this.collector.addMetric('cache_miss', 1, {
      provider,
      cache_type: cacheType
    })
  }

  /**
   * Enregistre une métrique personnalisée
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enabled) {
      return
    }

    this.collector.addMetric(name, value, tags)
  }

  /**
   * Obtient le statut de santé
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const stats = this.collector.getStats()
    const now = Date.now()
    
    // Vérifier la santé de chaque provider
    const services: Record<string, any> = {}
    for (const [name, provider] of this.providers) {
      try {
        const isHealthy = await provider.isHealthy()
        services[name] = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          lastCheck: now
        }
      } catch (error) {
        services[name] = {
          status: 'unhealthy',
          lastCheck: now
        }
      }
    }
    
    // Déterminer le statut global
    const serviceStatuses = Object.values(services).map((s: any) => s.status)
    let globalStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (serviceStatuses.includes('unhealthy')) {
      globalStatus = 'unhealthy'
    } else if (serviceStatuses.includes('degraded')) {
      globalStatus = 'degraded'
    }
    
    // Vérifier les seuils d'alerte
    if (this.config.alerts?.enabled) {
      if (stats.errorRate > this.config.alerts.errorRateThreshold) {
        globalStatus = 'degraded'
      }
      if (stats.averageResponseTime > this.config.alerts.responseTimeThreshold) {
        globalStatus = 'degraded'
      }
    }
    
    return {
      status: globalStatus,
      timestamp: now,
      services,
      metrics: {
        totalRequests: stats.totalRequests,
        totalErrors: stats.totalErrors,
        averageResponseTime: stats.averageResponseTime,
        cacheHitRate: 0 // TODO: Calculer le taux de hit de cache
      }
    }
  }

  /**
   * Obtient les métriques
   */
  getMetrics(name?: string, timeRange?: { start: number; end: number }): MetricData[] {
    if (name) {
      return this.collector.getMetrics(name, timeRange)
    }
    
    // Retourner toutes les métriques
    const allMetrics: MetricData[] = []
    const uniqueNames = new Set(this.collector['metrics'].map((m: MetricData) => m.name))
    
    for (const metricName of uniqueNames) {
      allMetrics.push(...this.collector.getMetrics(metricName, timeRange))
    }
    
    return allMetrics
  }

  /**
   * Obtient les appels API
   */
  getApiCalls(timeRange?: { start: number; end: number }): ApiCallMetric[] {
    return this.collector.getApiCalls(timeRange)
  }

  /**
   * Obtient les statistiques
   */
  getStats(timeRange?: { start: number; end: number }) {
    return this.collector.getStats(timeRange)
  }

  /**
   * Enregistre un provider pour les vérifications de santé
   */
  registerProvider(name: string, provider: any): void {
    this.providers.set(name, provider)
  }

  /**
   * Démarre les vérifications de santé périodiques
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthStatus()
        this.recordMetric('health_status', health.status === 'healthy' ? 1 : 0)
      } catch (error) {
        console.error('Erreur lors de la vérification de santé:', error)
      }
    }, this.config.healthChecks.interval)
  }

  /**
   * Arrête le service
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    
    // Nettoyer les anciennes données
    this.collector.cleanup()
  }

  /**
   * Obtient un rapport de santé formaté
   */
  async getHealthReport(): Promise<string> {
    const health = await this.getHealthStatus()
    const stats = this.getStats()
    
    let report = `=== Rapport de Santé Card API Service ===\n`
    report += `Statut Global: ${health.status.toUpperCase()}\n`
    report += `Timestamp: ${new Date(health.timestamp).toISOString()}\n\n`
    
    report += `=== Services ===\n`
    for (const [name, service] of Object.entries(health.services)) {
      report += `${name}: ${service.status.toUpperCase()}\n`
    }
    
    report += `\n=== Métriques ===\n`
    report += `Total Requêtes: ${stats.totalRequests}\n`
    report += `Total Erreurs: ${stats.totalErrors}\n`
    report += `Taux d'Erreur: ${stats.errorRate.toFixed(2)}%\n`
    report += `Temps de Réponse Moyen: ${stats.averageResponseTime.toFixed(2)}ms\n`
    
    return report
  }
}

/**
 * Configuration par défaut pour le monitoring
 */
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  metrics: {
    collectApiCalls: true,
    collectResponseTimes: true,
    collectErrorRates: true,
    collectCacheHitRates: true
  },
  healthChecks: {
    enabled: true,
    interval: 60000 // 1 minute
  },
  alerts: {
    enabled: true,
    errorRateThreshold: 10, // 10%
    responseTimeThreshold: 5000 // 5 secondes
  }
}
