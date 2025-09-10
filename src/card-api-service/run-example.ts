/**
 * Script pour exécuter les exemples d'utilisation
 */

import { runAllExamples } from './examples/usage-example'

async function main() {
  console.log('🚀 Lancement des exemples du Card API Service...\n')
  
  try {
    await runAllExamples()
    console.log('\n✅ Tous les exemples ont été exécutés avec succès !')
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'exécution des exemples:', error)
    process.exit(1)
  }
}

// Exécution si le script est appelé directement
if (require.main === module) {
  main()
}
