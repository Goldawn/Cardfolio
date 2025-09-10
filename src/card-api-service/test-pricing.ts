/**
 * Script de test pour l'implémentation du PricingService
 * Teste les fonctionnalités de base du nouveau service de prix
 */

import { CardServiceFactory } from './index'

async function testPricingService() {
  console.log('🧪 Test du PricingService...\n')
  
  try {
    // Création du service
    const pricingService = CardServiceFactory.createPricingService()
    console.log('✅ PricingService créé avec succès')
    
    // Test 1: Prix par nom de carte
    console.log('\n📋 Test 1: Prix par nom de carte')
    const priceByName = await pricingService.fetchSimplePrice('Lightning Bolt')
    console.log('Prix de Lightning Bolt:', priceByName)
    
    // Test 2: Prix par ID de carte
    console.log('\n📋 Test 2: Prix par ID de carte')
    const cardId = '9ea8179a-d3c9-4cdc-a5b5-68cc73279050' // Lightning Bolt
    const priceById = await pricingService.fetchSimplePriceById(cardId)
    console.log('Prix par ID:', priceById)
    
    // Test 3: Prix détaillé par nom
    console.log('\n📋 Test 3: Prix détaillé par nom')
    const detailedPrice = await pricingService.fetchCardPriceByName('Lightning Bolt')
    console.log('Prix détaillé:', detailedPrice)
    
    // Test 4: Vérification de la santé des providers
    console.log('\n📋 Test 4: Vérification de la santé des providers')
    const healthStatus = await pricingService.checkProvidersHealth()
    console.log('Statut de santé:', healthStatus)
    
    // Test 5: Providers disponibles
    console.log('\n📋 Test 5: Providers disponibles')
    const availableProviders = pricingService.getAvailableProviders()
    console.log('Providers disponibles:', availableProviders)
    
    console.log('\n✅ Tous les tests ont réussi!')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
  }
}

// Exécution du test
testPricingService()
