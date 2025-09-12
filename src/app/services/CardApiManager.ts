/**
 * Card API Manager - Singleton pour gérer les services de cartes
 * Utilise le CardServiceFactory pour créer et gérer les instances
 */

import { CardServiceFactory, type CardService } from '@/card-api-service'

class CardApiManager {
  private static instance: CardApiManager
  private cardService: CardService

  private constructor() {
    // Créer le service avec la configuration par défaut
    this.cardService = CardServiceFactory.create()
  }

  static getInstance(): CardApiManager {
    if (!CardApiManager.instance) {
      CardApiManager.instance = new CardApiManager()
    }
    return CardApiManager.instance
  }

  getCardService(): CardService {
    return this.cardService
  }
}

// Export de l'instance singleton
export const cardApiManager = CardApiManager.getInstance()
