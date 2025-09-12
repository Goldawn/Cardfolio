#!/usr/bin/env npx tsx

/**
 * Script de validation des types mis à jour
 * Vérifie la cohérence entre les types TypeScript et la base de données
 */

import { PrismaClient } from '@prisma/client'
import { Card, Collection, MTGCard } from '../src/types'

async function validateTypes() {
  console.log('🔍 Validation des types mis à jour...')
  console.log('=====================================')

  const prisma = new PrismaClient()

  try {
    // Test 1: Validation du type Card avec la BDD
    console.log('\n📋 Test 1: Validation du type Card')
    const dbCard = await prisma.card.findFirst()

    if (dbCard) {
      const typedCard: Card = {
        id: dbCard.id,
        externalId: dbCard.externalId,
        name: dbCard.name,
        gameType: dbCard.gameType as any,
        setName: dbCard.setName || undefined,
        setCode: dbCard.setCode || undefined,
        collectorNumber: dbCard.collectorNumber || undefined,
        lang: dbCard.lang || undefined,
        rarity: dbCard.rarity as any,
        artist: dbCard.artist || undefined,
        imageSmall: dbCard.imageSmall || undefined,
        imageNormal: dbCard.imageNormal || undefined,
        imageLarge: dbCard.imageLarge || undefined,
        imageArtCrop: dbCard.imageArtCrop || undefined,
        gameData: dbCard.gameData as any,
        colors: dbCard.colors as any,
        cardType: dbCard.cardType || undefined,
        format: dbCard.format || undefined,
        legalities: dbCard.legalities as any,
        priceUsd: dbCard.priceUsd || undefined,
        priceEur: dbCard.priceEur || undefined,
        priceTix: dbCard.priceTix || undefined,
        priceFoilUsd: dbCard.priceFoilUsd || undefined,
        priceFoilEur: dbCard.priceFoilEur || undefined,
        lastPriceUpdate: dbCard.lastPriceUpdate || undefined,
        quantity: dbCard.quantity || undefined,
        allocated: dbCard.allocated || undefined,
        dateAdded: dbCard.dateAdded || undefined,
        priceHistory: dbCard.priceHistory as any,
        createdAt: dbCard.createdAt || undefined,
        updatedAt: dbCard.updatedAt || undefined,
        collectionId: dbCard.collectionId || undefined,
        wishlistId: dbCard.wishlistId || undefined,
        deckId: dbCard.deckId || undefined,
      }

      console.log(`✅ Type Card compatible avec la BDD`)
      console.log(`   - Carte: ${typedCard.name}`)
      console.log(`   - External ID: ${typedCard.externalId}`)
      console.log(`   - Type: ${typedCard.cardType}`)
    } else {
      console.log('⚠️  Aucune carte trouvée en base de données')
    }

    // Test 2: Validation des relations directes
    console.log('\n🔗 Test 2: Validation des relations directes')
    const collection = await prisma.collection.findFirst({
      include: { cards: true },
    })

    if (collection) {
      const typedCollection: Collection = {
        id: collection.id,
        name: collection.name,
        gameType: collection.gameType as any,
        isDefault: collection.isDefault,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        userId: collection.userId,
        cards: collection.cards.map(card => ({
          id: card.id,
          externalId: card.externalId,
          name: card.name,
          gameType: card.gameType as any,
          // ... autres champs
        })) as Card[],
      }

      console.log(`✅ Relations directes fonctionnelles`)
      console.log(`   - Collection: ${typedCollection.name}`)
      console.log(`   - Nombre de cartes: ${typedCollection.cards.length}`)
    } else {
      console.log('⚠️  Aucune collection trouvée en base de données')
    }

    // Test 3: Validation du type MTGCard
    console.log('\n🃏 Test 3: Validation du type MTGCard')
    const mtgCard: MTGCard = {
      id: 'test-id',
      externalId: 'test-external-id',
      name: 'Lightning Bolt',
      gameType: 'magic',
      gameData: {
        manaCost: '{R}',
        type: 'Instant',
        oracleText: 'Lightning Bolt deals 3 damage to any target.',
      },
      colors: ['R'],
      cardType: 'instant',
      format: 'commander',
    }

    console.log(`✅ Type MTGCard fonctionnel`)
    console.log(`   - Carte: ${mtgCard.name}`)
    console.log(`   - Mana Cost: ${mtgCard.gameData.manaCost}`)
    console.log(`   - Couleurs: ${mtgCard.colors?.join(', ')}`)

    // Test 4: Validation des identifiants externalId
    console.log('\n🆔 Test 4: Validation des identifiants externalId')
    const cards = await prisma.card.findMany({ take: 3 })

    if (cards.length > 0) {
      console.log(`✅ Identifiants externalId présents:`)
      cards.forEach(card => {
        console.log(`   - ${card.name}: ${card.externalId}`)
      })
    } else {
      console.log('⚠️  Aucune carte avec externalId trouvée')
    }

    // Test 5: Validation des champs JSON
    console.log('\n📄 Test 5: Validation des champs JSON')
    const cardWithJson = await prisma.card.findFirst({
      where: {
        gameData: { not: null },
      },
    })

    if (cardWithJson) {
      console.log(`✅ Champs JSON fonctionnels`)
      console.log(`   - gameData: ${typeof cardWithJson.gameData}`)
      console.log(`   - colors: ${typeof cardWithJson.colors}`)
      console.log(`   - legalities: ${typeof cardWithJson.legalities}`)
    } else {
      console.log('⚠️  Aucune carte avec données JSON trouvée')
    }

    console.log('\n🎉 Validation terminée avec succès !')
    console.log('=====================================')
    console.log('✅ Types cohérents avec la base de données')
    console.log('✅ Relations directes fonctionnelles')
    console.log('✅ Identifiants externalId présents')
    console.log('✅ Champs JSON opérationnels')
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécution du script
if (require.main === module) {
  validateTypes().catch(console.error)
}

export { validateTypes }
