/**
 * Démonstration du MonitoringService en action
 */

import { 
  CardServiceFactory,
  CacheService,
  RateLimitService,
  MonitoringService,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_MONITORING_CONFIG
} from '../index'

async function demonstrateMonitoringService() {
  console.log('🎯 Démonstration du MonitoringService\n')
  
  // Initialisation des services
  const cacheService = new CacheService({
    enabled: true,
    ttl: 3600,
    provider: 'memory'
  })
  
  const rateLimitService = new RateLimitService(DEFAULT_RATE_LIMIT_CONFIG)
  
  const monitoringService = new MonitoringService({
    ...DEFAULT_MONITORING_CONFIG,
    enabled: true,
    metrics: {
      collectApiCalls: true,
      collectResponseTimes: true,
      collectErrorRates: true,
      collectCacheHitRates: true
    }
  })

  const cardService = CardServiceFactory.create()

  console.log('✅ Services initialisés\n')

  // ========================================
  // 1. SIMULATION D'APPELS API
  // ========================================

  console.log('📊 Simulation d\'appels API...\n')

  // Simuler des appels API réussis
  for (let i = 0; i < 5; i++) {
    const startTime = Date.now()
    const responseTime = Math.random() * 1000 + 200 // 200-1200ms
    
    monitoringService.recordApiCall(
      'scryfall',
      '/cards',
      'GET',
      responseTime,
      200,
      true
    )
    
    console.log(`✅ Appel API ${i + 1} - Temps: ${responseTime.toFixed(2)}ms`)
  }

  // Simuler des appels API avec erreurs
  for (let i = 0; i < 2; i++) {
    const responseTime = Math.random() * 500 + 100
    
    monitoringService.recordApiCall(
      'scryfall',
      '/cards',
      'GET',
      responseTime,
      500,
      false
    )
    
    console.log(`❌ Appel API avec erreur ${i + 1} - Temps: ${responseTime.toFixed(2)}ms`)
  }

  // ========================================
  // 2. SIMULATION DE CACHE
  // ========================================

  console.log('\n💾 Simulation de cache...\n')

  // Simuler des hits de cache
  for (let i = 0; i < 3; i++) {
    monitoringService.recordCacheHit('scryfall', 'card')
    console.log(`🎯 Cache hit ${i + 1}`)
  }

  // Simuler des misses de cache
  for (let i = 0; i < 2; i++) {
    monitoringService.recordCacheMiss('scryfall', 'card')
    console.log(`💥 Cache miss ${i + 1}`)
  }

  // ========================================
  // 3. AFFICHAGE DES MÉTRIQUES
  // ========================================

  console.log('\n📈 Métriques collectées:\n')

  const stats = monitoringService.getStats()
  console.log('📊 Statistiques:')
  console.log(`   Total Requêtes: ${stats.totalRequests}`)
  console.log(`   Total Erreurs: ${stats.totalErrors}`)
  console.log(`   Taux d'Erreur: ${stats.errorRate.toFixed(2)}%`)
  console.log(`   Temps de Réponse Moyen: ${stats.averageResponseTime.toFixed(2)}ms`)
  
  console.log('\n🏢 Requêtes par Provider:')
  Object.entries(stats.requestsByProvider).forEach(([provider, count]) => {
    console.log(`   ${provider}: ${count} requêtes`)
  })

  console.log('\n🔗 Requêtes par Endpoint:')
  Object.entries(stats.requestsByEndpoint).forEach(([endpoint, count]) => {
    console.log(`   ${endpoint}: ${count} requêtes`)
  })

  // ========================================
  // 4. ÉTAT DE SANTÉ
  // ========================================

  console.log('\n🏥 État de santé:\n')

  const healthStatus = await monitoringService.getHealthStatus()
  console.log(`Statut Global: ${healthStatus.status.toUpperCase()}`)
  console.log(`Timestamp: ${new Date(healthStatus.timestamp).toLocaleString()}`)
  
  console.log('\n🔧 Services:')
  Object.entries(healthStatus.services).forEach(([service, info]) => {
    console.log(`   ${service}: ${info.status.toUpperCase()}`)
  })

  console.log('\n📊 Métriques de Santé:')
  console.log(`   Total Requêtes: ${healthStatus.metrics.totalRequests}`)
  console.log(`   Total Erreurs: ${healthStatus.metrics.totalErrors}`)
  console.log(`   Temps de Réponse Moyen: ${healthStatus.metrics.averageResponseTime.toFixed(2)}ms`)
  console.log(`   Taux de Hit de Cache: ${healthStatus.metrics.cacheHitRate.toFixed(2)}%`)

  // ========================================
  // 5. RAPPORT COMPLET
  // ========================================

  console.log('\n📋 Rapport complet:\n')

  const healthReport = await monitoringService.getHealthReport()
  console.log(healthReport)

  // ========================================
  // 6. MÉTRIQUES DÉTAILLÉES
  // ========================================

  console.log('\n🔍 Métriques détaillées:\n')

  const apiCalls = monitoringService.getApiCalls()
  console.log('📞 Appels API récents:')
  apiCalls.slice(-3).forEach((call, index) => {
    console.log(`   ${index + 1}. ${call.provider} ${call.endpoint} - ${call.responseTime}ms - ${call.success ? '✅' : '❌'}`)
  })

  const responseTimeMetrics = monitoringService.getMetrics('api_response_time')
  console.log('\n⏱️ Métriques de temps de réponse:')
  responseTimeMetrics.slice(-3).forEach((metric, index) => {
    console.log(`   ${index + 1}. ${metric.value.toFixed(2)}ms (${new Date(metric.timestamp).toLocaleTimeString()})`)
  })

  // ========================================
  // 7. SIMULATION D'ALERTES
  // ========================================

  console.log('\n🚨 Simulation d\'alertes:\n')

  // Simuler un taux d'erreur élevé
  for (let i = 0; i < 10; i++) {
    monitoringService.recordApiCall(
      'scryfall',
      '/cards',
      'GET',
      Math.random() * 1000 + 200,
      500,
      false
    )
  }

  const newHealthStatus = await monitoringService.getHealthStatus()
  const newStats = monitoringService.getStats()

  console.log('📊 Nouvelles métriques après simulation d\'erreurs:')
  console.log(`   Taux d'Erreur: ${newStats.errorRate.toFixed(2)}%`)
  console.log(`   Statut: ${newHealthStatus.status.toUpperCase()}`)

  if (newStats.errorRate > 10) {
    console.log('🚨 ALERTE: Taux d\'erreur élevé détecté!')
  }

  if (newStats.averageResponseTime > 1000) {
    console.log('🚨 ALERTE: Temps de réponse élevé détecté!')
  }

  console.log('\n🎉 Démonstration terminée!')
}

// Exécution de la démonstration
demonstrateMonitoringService().catch(console.error)
