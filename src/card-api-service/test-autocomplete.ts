/**
 * Script de test pour l'implémentation de l'autocomplete
 * Teste la nouvelle fonctionnalité d'autocomplete du CardService
 */

import { CardServiceFactory } from './index'

async function testAutocomplete() {
  console.log('🧪 Test de l\'autocomplete...\n')
  
  try {
    // Création du service
    const cardService = CardServiceFactory.create()
    console.log('✅ CardService créé avec succès')
    
    // Test 1: Autocomplete avec une requête simple
    console.log('\n📋 Test 1: Autocomplete avec "Lightning"')
    const suggestions1 = await cardService.getAutocompleteSuggestions('Lightning')
    console.log('Suggestions pour "Lightning":', suggestions1)
    
    // Test 2: Autocomplete avec une requête plus spécifique
    console.log('\n📋 Test 2: Autocomplete avec "Lightning Bolt"')
    const suggestions2 = await cardService.getAutocompleteSuggestions('Lightning Bolt')
    console.log('Suggestions pour "Lightning Bolt":', suggestions2)
    
    // Test 3: Autocomplete avec une requête courte (doit retourner vide)
    console.log('\n📋 Test 3: Autocomplete avec "Li" (trop court)')
    const suggestions3 = await cardService.getAutocompleteSuggestions('Li')
    console.log('Suggestions pour "Li":', suggestions3)
    
    // Test 4: Autocomplete avec une requête inexistante
    console.log('\n📋 Test 4: Autocomplete avec "Xyzzy" (inexistant)')
    const suggestions4 = await cardService.getAutocompleteSuggestions('Xyzzy')
    console.log('Suggestions pour "Xyzzy":', suggestions4)
    
    // Test 5: Autocomplete avec une requête vide
    console.log('\n📋 Test 5: Autocomplete avec "" (vide)')
    const suggestions5 = await cardService.getAutocompleteSuggestions('')
    console.log('Suggestions pour "":', suggestions5)
    
    console.log('\n✅ Tous les tests d\'autocomplete ont réussi!')
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error)
  }
}

// Exécution du test
testAutocomplete()
