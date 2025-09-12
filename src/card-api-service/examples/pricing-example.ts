/**
 * Exemples d'utilisation du PricingService
 * Démontre comment utiliser le nouveau service de prix
 */

import { CardServiceFactory } from '../index'

/**
 * Exemple 1: Utilisation basique du PricingService
 */
export async function basicPricingExample() {
  console.log('=== Exemple 1: Utilisation basique du PricingService ===')

  const pricingService = CardServiceFactory.createPricingService()

  try {
    // Récupérer le prix d'une carte par nom
    const price = await pricingService.fetchCardPriceByName('Lightning Bolt')
    console.log('Prix de Lightning Bolt:', price)

    // Récupérer le prix d'une carte par ID
    const cardId = '9ea8179a-d3c9-4cdc-a5b5-68cc73279050' // Lightning Bolt
    const priceById = await pricingService.fetchCardPrice(cardId)
    console.log('Prix par ID:', priceById)
  } catch (error) {
    console.error("Erreur dans l'exemple basique:", error)
  }
}

/**
 * Exemple 2: Utilisation avec fallback automatique
 */
export async function fallbackPricingExample() {
  console.log('=== Exemple 2: Utilisation avec fallback automatique ===')

  const pricingService = CardServiceFactory.createPricingService()

  try {
    // Utilisation avec fallback automatique
    const price =
      await pricingService.fetchCardPriceByNameWithFallback('Black Lotus')
    console.log('Prix de Black Lotus (avec fallback):', price)
  } catch (error) {
    console.error("Erreur dans l'exemple fallback:", error)
  }
}

/**
 * Exemple 3: Récupération de prix en lot
 */
export async function bulkPricingExample() {
  console.log('=== Exemple 3: Récupération de prix en lot ===')

  const pricingService = CardServiceFactory.createPricingService()

  try {
    const cardIds = [
      '9ea8179a-d3c9-4cdc-a5b5-68cc73279050', // Lightning Bolt
      'a3fb7228-e76b-4e96-a40e-20b5fed75685', // Counterspell
      'b2c6aa39-2d2a-459c-a555-f48d1e7bb6f7', // Brainstorm
    ]

    const prices = await pricingService.fetchBulkPrices(cardIds)
    console.log('Prix en lot:', prices)
  } catch (error) {
    console.error("Erreur dans l'exemple bulk:", error)
  }
}

/**
 * Exemple 4: Compatibilité avec l'ancienne API
 */
export async function compatibilityExample() {
  console.log("=== Exemple 4: Compatibilité avec l'ancienne API ===")

  const pricingService = CardServiceFactory.createPricingService()

  try {
    // Format simple comme l'ancienne API
    const simplePrice = await pricingService.fetchSimplePrice('Lightning Bolt')
    console.log('Prix simple (compatibilité):', simplePrice)

    const simplePriceById = await pricingService.fetchSimplePriceById(
      '9ea8179a-d3c9-4cdc-a5b5-68cc73279050'
    )
    console.log('Prix simple par ID (compatibilité):', simplePriceById)
  } catch (error) {
    console.error("Erreur dans l'exemple compatibilité:", error)
  }
}

/**
 * Exemple 5: Vérification de la santé des providers
 */
export async function healthCheckExample() {
  console.log('=== Exemple 5: Vérification de la santé des providers ===')

  const pricingService = CardServiceFactory.createPricingService()

  try {
    const healthStatus = await pricingService.checkProvidersHealth()
    console.log('Statut de santé des providers:', healthStatus)

    const availableProviders = pricingService.getAvailableProviders()
    console.log('Providers disponibles:', availableProviders)

    const defaultProvider = pricingService.getDefaultProvider()
    console.log('Provider par défaut:', defaultProvider)
  } catch (error) {
    console.error("Erreur dans l'exemple health check:", error)
  }
}

/**
 * Exemple 6: Utilisation avec tous les services
 */
export async function allServicesExample() {
  console.log('=== Exemple 6: Utilisation avec tous les services ===')

  try {
    const { cardService, pricingService } =
      CardServiceFactory.createAllServices()

    // Récupérer une carte
    const card = await cardService.fetchCardByName('Lightning Bolt')
    console.log('Carte récupérée:', card.name)

    // Récupérer le prix de la même carte
    const price = await pricingService.fetchCardPriceByName('Lightning Bolt')
    console.log('Prix de la carte:', price)
  } catch (error) {
    console.error("Erreur dans l'exemple tous services:", error)
  }
}

/**
 * Exécute tous les exemples
 */
export async function runAllPricingExamples() {
  console.log('🚀 Démarrage des exemples de pricing...\n')

  try {
    await basicPricingExample()
    console.log('\n')

    await fallbackPricingExample()
    console.log('\n')

    await bulkPricingExample()
    console.log('\n')

    await compatibilityExample()
    console.log('\n')

    await healthCheckExample()
    console.log('\n')

    await allServicesExample()
    console.log('\n')

    console.log('✅ Tous les exemples de pricing ont été exécutés avec succès!')
  } catch (error) {
    console.error("❌ Erreur lors de l'exécution des exemples:", error)
  }
}

// Exécution directe si le fichier est appelé directement
if (require.main === module) {
  runAllPricingExamples()
}
