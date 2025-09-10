/**
 * Exemple d'utilisation du service Card API
 */

import { CardServiceFactory } from '../factory/CardServiceFactory'
import { ScryfallProvider } from '../providers/ScryfallProvider'
import { ScryfallAdapter } from '../adapters/ScryfallAdapter'

// Exemple 1: Utilisation basique avec la factory
export async function basicUsageExample() {
  // Création du service avec configuration par défaut
  const cardService = CardServiceFactory.create()
  
  console.log('Service créé avec les providers:', cardService.providers.keys())
  console.log('Configuration:', cardService.config.defaultProvider)
}

// Exemple 2: Utilisation directe du provider Scryfall
export async function directProviderExample() {
  const provider = new ScryfallProvider()
  const adapter = new ScryfallAdapter()
  
  try {
    // Récupération d'une carte
    const response = await provider.fetchCard({
      cardId: '9ea8179a-d3c9-4cdc-a5b5-68cc73279050' // Lightning Bolt
    })
    
    if (response.error) {
      console.error('Erreur:', response.error.message)
      return
    }
    
    // Transformation vers le format app
    const card = adapter.transformCard(response.data as any)
    
    console.log('Carte récupérée:', {
      name: card.name,
      set: card.setCode,
      rarity: card.rarity,
      price: card.priceHistory?.[0]
    })
    
  } catch (error) {
    console.error('Erreur lors de la récupération:', error)
  }
}

// Exemple 3: Recherche de cartes
export async function searchCardsExample() {
  const provider = new ScryfallProvider()
  const adapter = new ScryfallAdapter()
  
  try {
    const responses = await provider.searchCards('lightning bolt')
    
    const cards = responses
      .filter(response => !response.error)
      .map(response => adapter.transformCard(response.data as any))
    
    console.log(`${cards.length} cartes trouvées pour "lightning bolt"`)
    cards.forEach(card => {
      console.log(`- ${card.name} (${card.setCode})`)
    })
    
  } catch (error) {
    console.error('Erreur lors de la recherche:', error)
  }
}

// Exemple 4: Récupération des cartes d'un set
export async function fetchSetCardsExample() {
  const provider = new ScryfallProvider()
  const adapter = new ScryfallAdapter()
  
  try {
    const response = await provider.fetchSetCards({
      setCode: 'dmu', // Dominaria United
      language: 'en'
    })
    
    if (response.error) {
      console.error('Erreur:', response.error.message)
      return
    }
    
    const cards = adapter.transformCards(response.data as any)
    
    console.log(`${cards.length} cartes récupérées du set DMU`)
    
    // Afficher les 5 premières cartes
    cards.slice(0, 5).forEach(card => {
      console.log(`- ${card.name} (${card.collectorNumber})`)
    })
    
  } catch (error) {
    console.error('Erreur lors de la récupération du set:', error)
  }
}

// Exemple 5: Configuration personnalisée
export async function customConfigExample() {
  const customConfig = {
    defaultProvider: 'scryfall',
    fallbackProviders: ['mtggoldfish'],
    cache: {
      enabled: true,
      ttl: 7200, // 2 heures
      maxSize: 5000,
      provider: 'memory' as const
    },
    providers: {
      scryfall: {
        name: 'scryfall',
        baseUrl: 'https://api.scryfall.com',
        rateLimit: {
          requests: 30, // Plus conservateur
          per: 'minute' as const
        },
        timeout: 15000, // Plus de temps
        retryAttempts: 5,
        enabled: true,
        priority: 1,
        fallbackEnabled: true
      }
    }
  }
  
  const cardService = CardServiceFactory.create(customConfig)
  
  console.log('Service créé avec configuration personnalisée')
  console.log('Cache TTL:', cardService.config.cache.ttl)
  console.log('Rate limit:', cardService.config.providers.scryfall.rateLimit)
}

// Exemple 6: Gestion d'erreurs et fallback
export async function errorHandlingExample() {
  const provider = new ScryfallProvider()
  const adapter = new ScryfallAdapter()
  
  try {
    // Tentative de récupération d'une carte inexistante
    const response = await provider.fetchCard({
      cardId: 'invalid-id'
    })
    
    if (response.error) {
      console.log('Erreur capturée:', {
        code: response.error.code,
        message: response.error.message,
        retryable: response.error.retryable
      })
      
      // Ici, on pourrait implémenter le fallback vers un autre provider
      if (response.error.retryable) {
        console.log('Erreur récupérable, on peut essayer un autre provider')
      }
    }
    
  } catch (error) {
    console.error('Erreur non gérée:', error)
  }
}

// Fonction pour exécuter tous les exemples
export async function runAllExamples() {
  console.log('=== Exemple 1: Utilisation basique ===')
  await basicUsageExample()
  
  console.log('\n=== Exemple 2: Provider direct ===')
  await directProviderExample()
  
  console.log('\n=== Exemple 3: Recherche de cartes ===')
  await searchCardsExample()
  
  console.log('\n=== Exemple 4: Cartes d\'un set ===')
  await fetchSetCardsExample()
  
  console.log('\n=== Exemple 5: Configuration personnalisée ===')
  await customConfigExample()
  
  console.log('\n=== Exemple 6: Gestion d\'erreurs ===')
  await errorHandlingExample()
}
