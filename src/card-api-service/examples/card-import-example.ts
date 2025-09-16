import { CardImportService } from '../services/CardImportService'

/**
 * Exemple d'utilisation du service d'import de cartes avec la nouvelle structure
 * où Card remplace CollectionItem, WishlistItem et DeckCard
 */
export async function runCardImportExamples() {
  console.log(
    "🚀 Démarrage des exemples d'import de cartes (nouvelle structure)...\n"
  )

  const importService = new CardImportService()

  try {
    // Exemple 1: Import d'une carte spécifique
    console.log("📋 Exemple 1: Import d'une carte spécifique")
    const cardResult = await importService.importCardById(
      '9ea8179a-d3c9-4cdc-a5b5-68cc73279050' // External ID (Scryfall ID pour Magic)
    )
    if (cardResult.success) {
      console.log('✅ Carte importée avec succès:', cardResult.card?.name)
    } else {
      console.log('❌ Erreur:', cardResult.error)
    }
    console.log('')

    const sets: string[] = [
      'dmr',
      'ltr',
      'inr'
    ] 

    const importSets = async (sets: string[]) => {
      for (const setCode of sets) {
        console.log(`📦 Import du set ${setCode}`)
        const setResult = await importService.importSetCards(setCode)
        console.log(`✅ ${setResult.success}/${setResult.total} cartes importées`)
        if (setResult.errors.length > 0) {
          console.log(
            `❌ ${setResult.errors.length} erreurs:`,
            setResult.errors.slice(0, 3)
          )
        }
        console.log('')
      }
    }

    await importSets(sets)

    // Exemple 2: Import des cartes d'un set
    // console.log("📋 Exemple 2: Import des cartes d'un set (DMR)")
    // const setResult = await importService.importSetCards('dmr')
    // console.log(`✅ ${setResult.success}/${setResult.total} cartes importées`)
    // if (setResult.errors.length > 0) {
    //   console.log(
    //     `❌ ${setResult.errors.length} erreurs:`,
    //     setResult.errors.slice(0, 3)
    //   )
    // }
    // console.log('')





    // // Exemple 3: Recherche et import de cartes
    // console.log('📋 Exemple 3: Recherche et import de cartes "Lightning Bolt"')
    // const searchResult = await importService.searchAndImportCards(
    //   'Lightning Bolt',
    //   5
    // )
    // console.log(
    //   `✅ ${searchResult.imported} cartes importées sur ${searchResult.found} trouvées`
    // )
    // console.log('')

    // // Exemple 4: Synchronisation des cartes manquantes
    // console.log('📋 Exemple 4: Synchronisation des cartes manquantes')
    // const syncResult = await importService.importMissingCards()
    // console.log(`✅ ${syncResult.imported} cartes manquantes importées`)
    // if (syncResult.errors.length > 0) {
    //   console.log(`❌ ${syncResult.errors.length} erreurs lors de la sync`)
    // }
    // console.log('')

    // Exemple 5: Statistiques de la base de données
    console.log('📋 Exemple 5: Statistiques de la base de données')
    const stats = await importService.getDatabaseStats()
    console.log('📊 Statistiques:', {
      totalCards: stats.totalCards,
      missingCards: stats.missingCards,
      cardsByGameType: stats.cardsByGameType,
      collectionCards: stats.collectionCards,
      wishlistCards: stats.wishlistCards,
      deckCards: stats.deckCards,
    })
  } catch (error) {
    console.error('❌ Erreur lors des exemples:', error)
  } finally {
    // Fermer les connexions
    await importService.disconnect()
    console.log('\n🔚 Exemples terminés')
  }
}

/**
 * Exemple d'import en lot pour initialiser la base
 */
export async function bulkImportExample() {
  console.log('🚀 Import en lot pour initialiser la base...\n')

  const importService = new CardImportService()

  try {
    // Sets populaires à importer
    const popularSets = [
      'dmu', // Dominaria United
      'bro', // The Brothers' War
      'one', // Phyrexia: All Will Be One
      'mom', // March of the Machine
      'mat', // March of the Machine: The Aftermath
      'woe', // Wilds of Eldraine
      'lci', // Lost Caverns of Ixalan
    ]

    let totalImported = 0
    let totalErrors = 0

    for (const setCode of popularSets) {
      console.log(`📦 Import du set ${setCode}...`)
      try {
        const result = await importService.importSetCards(setCode)
        totalImported += result.success
        totalErrors += result.errors.length

        console.log(`✅ ${result.success}/${result.total} cartes importées`)
        if (result.errors.length > 0) {
          console.log(`⚠️  ${result.errors.length} erreurs`)
        }
      } catch (error) {
        console.log(`❌ Erreur pour le set ${setCode}:`, error)
        totalErrors++
      }

      // Pause entre les sets pour respecter les rate limits
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    console.log(`\n📊 Résumé de l'import en lot:`)
    console.log(`✅ ${totalImported} cartes importées au total`)
    console.log(`❌ ${totalErrors} erreurs au total`)
  } catch (error) {
    console.error("❌ Erreur lors de l'import en lot:", error)
  } finally {
    await importService.disconnect()
    console.log('\n🔚 Import en lot terminé')
  }
}

/**
 * Exemple d'ajout de cartes aux collections/wishlists/decks
 */
export async function addCardsToCollectionsExample() {
  console.log("🎯 Exemple d'ajout de cartes aux collections...\n")

  const importService = new CardImportService()

  try {
    // Exemple d'ajout à une collection (nécessite des IDs valides)
    console.log("📋 Ajout d'une carte à une collection")
    const collectionResult = await importService.addCardToCollection(
      '9ea8179a-d3c9-4cdc-a5b5-68cc73279050', // External ID (Scryfall ID pour Magic)
      'collection-id-example', // Collection ID (à remplacer par un vrai ID)
      2 // Quantité
    )

    if (collectionResult.success) {
      console.log(
        '✅ Carte ajoutée à la collection:',
        collectionResult.card?.name
      )
    } else {
      console.log('❌ Erreur:', collectionResult.error)
    }

    // Exemple d'ajout à une wishlist
    console.log("\n📋 Ajout d'une carte à une wishlist")
    const wishlistResult = await importService.addCardToWishlist(
      '9ea8179a-d3c9-4cdc-a5b5-68cc73279050', // External ID (Scryfall ID pour Magic)
      'wishlist-id-example', // Wishlist ID (à remplacer par un vrai ID)
      1 // Quantité
    )

    if (wishlistResult.success) {
      console.log('✅ Carte ajoutée à la wishlist:', wishlistResult.card?.name)
    } else {
      console.log('❌ Erreur:', wishlistResult.error)
    }

    // Exemple d'ajout à un deck
    console.log("\n📋 Ajout d'une carte à un deck")
    const deckResult = await importService.addCardToDeck(
      '9ea8179a-d3c9-4cdc-a5b5-68cc73279050', // External ID (Scryfall ID pour Magic)
      'deck-id-example', // Deck ID (à remplacer par un vrai ID)
      4 // Quantité
    )

    if (deckResult.success) {
      console.log('✅ Carte ajoutée au deck:', deckResult.card?.name)
    } else {
      console.log('❌ Erreur:', deckResult.error)
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout aux collections:", error)
  } finally {
    await importService.disconnect()
    console.log("\n🔚 Exemple d'ajout terminé")
  }
}

/**
 * Exemple de mise à jour des prix
 */
export async function updatePricesExample() {
  console.log('💰 Mise à jour des prix...\n')

  const importService = new CardImportService()

  try {
    const result = await importService.updateAllCardPrices()
    console.log(`✅ ${result.updated} cartes mises à jour`)
    if (result.errors.length > 0) {
      console.log(
        `❌ ${result.errors.length} erreurs lors de la mise à jour des prix`
      )
    }
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des prix:', error)
  } finally {
    await importService.disconnect()
    console.log('\n🔚 Mise à jour des prix terminée')
  }
}

// Exécuter les exemples si ce fichier est appelé directement
if (require.main === module) {
  runCardImportExamples()
    .then(() => console.log('✅ Exemples terminés avec succès'))
    .catch(error => console.error('❌ Erreur:', error))
}
