#!/usr/bin/env tsx

/**
 * Script de migration vers le nouveau modèle Card
 *
 * Ce script :
 * 1. Supprime l'ancienne base de données
 * 2. Applique le nouveau schéma Prisma
 * 3. Régénère le client Prisma
 * 4. Optionnellement, importe des cartes de test
 */

import { execSync } from 'child_process'
import { existsSync, unlinkSync } from 'fs'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'prisma', 'dev.db')
const DB_PATH_ALT = join(process.cwd(), 'prisma', 'prisma', 'dev.db')

async function runCommand(command: string, description: string) {
  console.log(`🔄 ${description}...`)
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() })
    console.log(`✅ ${description} terminé`)
  } catch (error) {
    console.error(`❌ Erreur lors de ${description}:`, error)
    throw error
  }
}

async function deleteDatabase() {
  console.log("🗑️  Suppression de l'ancienne base de données...")

  if (existsSync(DB_PATH)) {
    unlinkSync(DB_PATH)
    console.log('✅ Base de données principale supprimée')
  }

  if (existsSync(DB_PATH_ALT)) {
    unlinkSync(DB_PATH_ALT)
    console.log('✅ Base de données alternative supprimée')
  }
}

async function migrateDatabase() {
  console.log('🚀 Migration vers le nouveau modèle Card...\n')

  try {
    // 1. Supprimer l'ancienne base
    await deleteDatabase()

    // 2. Appliquer le nouveau schéma
    await runCommand('npx prisma db push', 'Application du nouveau schéma')

    // 3. Régénérer le client Prisma
    await runCommand('npx prisma generate', 'Génération du client Prisma')

    console.log('\n🎉 Migration terminée avec succès !')
    console.log('\n📋 Résumé des changements :')
    console.log('  • Modèle Card créé avec toutes les données de cartes')
    console.log('  • externalId générique (agnostique des APIs)')
    console.log('  • CollectionItem → Card (relation directe)')
    console.log('  • WishlistItem → Card (relation directe)')
    console.log('  • DeckCard → Card (relation directe)')
    console.log('  • CollectionChangeLog mis à jour pour référencer Card')
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    process.exit(1)
  }
}

async function importTestCards() {
  console.log('\n🧪 Import de cartes de test...')

  try {
    // Import de quelques cartes populaires pour tester
    const testCards = [
      '9ea8179a-d3c9-4cdc-a5b5-68cc73279050', // Blood Scrivener (External ID)
      '77c6fa74-5543-42ac-9ead-0e890b188e99', // Lightning Bolt (External ID)
    ]

    const { CardImportService } = await import('../src/card-api-service')
    const importService = new CardImportService()

    for (const cardId of testCards) {
      try {
        const result = await importService.importCardById(cardId)
        if (result.success) {
          console.log(`✅ ${result.card?.name} importée`)
        } else {
          console.log(`❌ Erreur pour ${cardId}: ${result.error}`)
        }
      } catch (error) {
        console.log(`❌ Erreur pour ${cardId}:`, error)
      }
    }

    await importService.disconnect()
    console.log('✅ Import de test terminé')
  } catch (error) {
    console.error("❌ Erreur lors de l'import de test:", error)
  }
}

async function main() {
  const args = process.argv.slice(2)
  const withTestImport = args.includes('--with-test')

  console.log('🎯 Migration vers le nouveau modèle Card')
  console.log('==========================================\n')

  await migrateDatabase()

  if (withTestImport) {
    await importTestCards()
  }

  console.log('\n🎉 Migration complète !')
  console.log('\n📝 Prochaines étapes :')
  console.log("  1. Tester l'import de cartes avec les exemples")
  console.log('  2. Mettre à jour les composants React pour utiliser Card')
  console.log('  3. Adapter les services existants')
  console.log('  4. Tester les fonctionnalités de collection/wishlist/deck')
}

// Exécuter le script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
}
