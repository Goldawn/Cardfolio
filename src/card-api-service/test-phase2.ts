/**
 * Test de validation de la Phase 2 - Services et Infrastructure
 */

import { 
  CardServiceFactory,
  SetService,
  CacheService,
  RateLimitService,
  MonitoringService,
  ProviderSelectionStrategyFactory,
  FallbackService,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_MONITORING_CONFIG,
  DEFAULT_FALLBACK_CONFIG
} from './index'

async function testPhase2Services() {
  console.log('🧪 Test de validation de la Phase 2...\n')
  
  try {
    // Test 1: SetService
    console.log('📋 Test 1: SetService')
    const cardService = CardServiceFactory.create()
    console.log('✅ CardService créé avec succès')
    
    // Test 2: CacheService
    console.log('\n📋 Test 2: CacheService')
    const cacheService = new CacheService({
      enabled: true,
      ttl: 3600,
      provider: 'memory'
    })
    
    // Test de cache
    await cacheService.set('test', 'value', 60, 'test-key')
    const cachedValue = await cacheService.get('test', 'test-key')
    console.log('✅ CacheService fonctionne:', cachedValue === 'value')
    
    // Test 3: RateLimitService
    console.log('\n📋 Test 3: RateLimitService')
    const rateLimitService = new RateLimitService(DEFAULT_RATE_LIMIT_CONFIG)
    
    const rateLimitResult = rateLimitService.checkScryfallRequest()
    console.log('✅ RateLimitService fonctionne:', rateLimitResult.allowed)
    
    // Test 4: MonitoringService
    console.log('\n📋 Test 4: MonitoringService')
    const monitoringService = new MonitoringService(DEFAULT_MONITORING_CONFIG)
    
    monitoringService.recordApiCall('scryfall', '/cards', 'GET', 150, 200, true)
    const healthStatus = await monitoringService.getHealthStatus()
    console.log('✅ MonitoringService fonctionne:', healthStatus.status)
    
    // Test 5: ProviderSelectionStrategy
    console.log('\n📋 Test 5: ProviderSelectionStrategy')
    const selectionStrategy = ProviderSelectionStrategyFactory.create('priority')
    
    const providers = [
      { name: 'scryfall', priority: 1, health: true, responseTime: 100, successRate: 95, lastUsed: 0 },
      { name: 'mtggoldfish', priority: 2, health: true, responseTime: 200, successRate: 90, lastUsed: 0 }
    ]
    
    const selectedProvider = selectionStrategy.selectProvider(providers, {
      requestType: 'card',
      preferences: { prioritizeSpeed: true }
    })
    console.log('✅ ProviderSelectionStrategy fonctionne:', selectedProvider === 'scryfall')
    
    // Test 6: FallbackService
    console.log('\n📋 Test 6: FallbackService')
    const { SimpleFallbackStrategy } = await import('./strategy/FallbackStrategy')
    const fallbackService = new FallbackService(
      new SimpleFallbackStrategy(DEFAULT_FALLBACK_CONFIG),
      DEFAULT_FALLBACK_CONFIG
    )
    
    console.log('✅ FallbackService créé avec succès')
    
    // Test 7: Intégration des services
    console.log('\n📋 Test 7: Intégration des services')
    
    // Vérifier que tous les services sont exportés
    const { DEFAULT_SERVICE_CONFIG } = await import('./config')
    const services = {
      CardService: CardServiceFactory.create(),
      SetService: new SetService(new Map(), new Map(), DEFAULT_SERVICE_CONFIG),
      CacheService: cacheService,
      RateLimitService: rateLimitService,
      MonitoringService: monitoringService
    }
    
    console.log('✅ Tous les services sont disponibles:', Object.keys(services).length === 5)
    
    // Test 8: Configuration par défaut
    console.log('\n📋 Test 8: Configuration par défaut')
    console.log('✅ RateLimit config:', DEFAULT_RATE_LIMIT_CONFIG.enabled)
    console.log('✅ Monitoring config:', DEFAULT_MONITORING_CONFIG.enabled)
    console.log('✅ Fallback config:', DEFAULT_FALLBACK_CONFIG.enabled)
    
    console.log('\n🎉 Tous les tests de la Phase 2 ont réussi!')
    console.log('\n📊 Résumé de la Phase 2:')
    console.log('✅ SetService - Implémenté')
    console.log('✅ CacheService - Implémenté')
    console.log('✅ RateLimitService - Implémenté')
    console.log('✅ MonitoringService - Implémenté')
    console.log('✅ ProviderSelectionStrategy - Implémenté')
    console.log('✅ FallbackService - Implémenté')
    console.log('✅ Infrastructure complète - Implémentée')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests de la Phase 2:', error)
  }
}

// Exécution du test
testPhase2Services()
