/**
 * Test de cas d'usage spécifiques
 */

import { ScryfallProvider } from './providers/ScryfallProvider'
import { ScryfallAdapter } from './adapters/ScryfallAdapter'

async function testSpecificCard() {
  console.log('🔍 Test de récupération d\'une carte spécifique...')
  
  const provider = new ScryfallProvider()
  const adapter = new ScryfallAdapter()
  
  // Test avec Lightning Bolt (carte très connue)
  const response = await provider.fetchCard({
    cardName: 'Lightning Bolt'
  })
  
  if (response.error) {
    console.error('❌ Erreur:', response.error.message)
    return
  }
  
  const card = adapter.transformCard(response.data as any)
  
  console.log('✅ Carte récupérée:')
  console.log(`   Nom: ${card.name}`)
  console.log(`   Set: ${card.setCode} (${card.setName})`)
  console.log(`   Rareté: ${card.rarity}`)
  console.log(`   Coût: ${card.gameData.manaCost}`)
  console.log(`   Type: ${card.gameData.typeLine}`)
  console.log(`   Prix USD: $${card.priceHistory?.[0]?.usd || 'N/A'}`)
  console.log(`   Prix EUR: €${card.priceHistory?.[0]?.eur || 'N/A'}`)
  console.log(`   Image: ${card.image?.normal || 'N/A'}`)
}

async function testSetCards() {
  console.log('\n📦 Test de récupération des cartes d\'un set...')
  
  const provider = new ScryfallProvider()
  const adapter = new ScryfallAdapter()
  
  // Test avec un petit set (Commander Legends)
  const response = await provider.fetchSetCards({
    setCode: 'cmr',
    language: 'en'
  })
  
  if (response.error) {
    console.error('❌ Erreur:', response.error.message)
    return
  }
  
  const cards = adapter.transformCards(response.data as any)
  
  console.log(`✅ ${cards.length} cartes récupérées du set CMR`)
  
  // Afficher quelques cartes intéressantes
  const legendaryCreatures = cards.filter(card => 
    card.gameData.typeLine?.includes('Legendary') && 
    card.gameData.typeLine?.includes('Creature')
  ).slice(0, 3)
  
  console.log('\n🏆 Quelques créatures légendaires:')
  legendaryCreatures.forEach(card => {
    console.log(`   - ${card.name} (${card.collectorNumber})`)
  })
}

async function testSearch() {
  console.log('\n🔍 Test de recherche de cartes...')
  
  const provider = new ScryfallProvider()
  const adapter = new ScryfallAdapter()
  
  // Recherche de cartes avec "dragon" dans le nom
  const responses = await provider.searchCards('name:dragon')
  
  const cards = responses
    .filter(response => !response.error)
    .map(response => adapter.transformCard(response.data as any))
  
  console.log(`✅ ${cards.length} dragons trouvés`)
  
  // Afficher les 5 premiers
  cards.slice(0, 5).forEach(card => {
    console.log(`   - ${card.name} (${card.setCode})`)
  })
}

async function testErrorHandling() {
  console.log('\n⚠️  Test de gestion d\'erreurs...')
  
  const provider = new ScryfallProvider()
  
  // Test avec un ID de carte invalide
  const response = await provider.fetchCard({
    cardId: 'invalid-id-12345'
  })
  
  if (response.error) {
    console.log('✅ Erreur correctement gérée:')
    console.log(`   Code: ${response.error.code}`)
    console.log(`   Message: ${response.error.message}`)
    console.log(`   Récupérable: ${response.error.retryable}`)
  } else {
    console.log('❌ L\'erreur n\'a pas été gérée correctement')
  }
}

async function main() {
  console.log('🚀 Tests spécifiques du Card API Service\n')
  
  try {
    await testSpecificCard()
    await testSetCards()
    await testSearch()
    await testErrorHandling()
    
    console.log('\n✅ Tous les tests spécifiques ont été exécutés avec succès !')
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error)
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main()
}
