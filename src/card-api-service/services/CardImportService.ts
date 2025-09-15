import { DatabaseAdapter } from '../adapters/DatabaseAdapter'
import { ScryfallAdapter } from '../adapters/ScryfallAdapter'
import { ScryfallProvider } from '../providers/ScryfallProvider'

/**
 * Service pour importer les cartes depuis les APIs vers la base de données
 * Avec la nouvelle structure où Card remplace CollectionItem, WishlistItem et DeckCard
 */
export class CardImportService {
  private dbAdapter: DatabaseAdapter
  private scryfallProvider: ScryfallProvider
  private scryfallAdapter: ScryfallAdapter

  constructor(dbAdapter?: DatabaseAdapter) {
    this.dbAdapter = dbAdapter || new DatabaseAdapter()
    this.scryfallProvider = new ScryfallProvider()
    this.scryfallAdapter = new ScryfallAdapter()
  }

  /**
   * Importe une carte spécifique par son externalId
   */
  async importCardById(
    externalId: string
  ): Promise<{ success: boolean; card?: any; error?: string }> {
    try {
      // Vérifier si la carte existe déjà en base
      const existingCard = await this.dbAdapter.getCardByExternalId(externalId)
      if (existingCard) {
        return { success: true, card: existingCard }
      }

      // Récupérer la carte depuis l'API
      const apiResponse = await this.scryfallProvider.fetchCard({
        cardId: externalId,
      })
      if (!apiResponse || !apiResponse.data) {
        return { success: false, error: "Carte non trouvée dans l'API" }
      }

      // Transformer les données (les données brutes sont dans apiResponse.data)
      const cardData = this.scryfallAdapter.transformCard(
        apiResponse.data as any
      )

      // Importer en base
      const importedCard = await this.dbAdapter.importCardFromAPI(cardData)

      return { success: true, card: importedCard }
    } catch (error) {
      console.error("Erreur lors de l'import de la carte:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }
    }
  }

  /**
   * Importe toutes les cartes d'un set
   */
  async importSetCards(setCode: string): Promise<{
    success: number
    errors: any[]
    total: number
  }> {
    try {
      // Récupérer les cartes du set depuis l'API
      const apiResponse = await this.scryfallProvider.fetchSetCards({ setCode })
      if (!apiResponse || !apiResponse.data) {
        throw new Error('Impossible de récupérer les cartes du set')
      }

      // Transformer les données
      const cardsData = this.scryfallAdapter.transformCards(
        apiResponse.data as any
      )

      // Importer en lot
      const result = await this.dbAdapter.bulkImportCards(cardsData)

      return {
        success: result.success,
        errors: result.errors,
        total: cardsData.length,
      }
    } catch (error) {
      console.error("Erreur lors de l'import du set:", error)
      throw error
    }
  }

  /**
   * Importe les cartes manquantes identifiées par syncMissingCards
   */
  async importMissingCards(): Promise<{
    imported: number
    errors: any[]
    missing: string[]
  }> {
    try {
      // Identifier les cartes manquantes
      const { missing } = await this.dbAdapter.syncMissingCards()

      if (missing.length === 0) {
        return { imported: 0, errors: [], missing: [] }
      }

      console.log(`Import de ${missing.length} cartes manquantes...`)

      const results = { imported: 0, errors: [] as any[] }

      // Importer chaque carte manquante
      for (const externalId of missing) {
        try {
          const result = await this.importCardById(externalId)
          if (result.success) {
            results.imported++
          } else {
            results.errors.push({
              externalId,
              error: result.error,
            })
          }
        } catch (error) {
          results.errors.push({
            externalId,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          })
        }
      }

      return {
        imported: results.imported,
        errors: results.errors,
        missing,
      }
    } catch (error) {
      console.error("Erreur lors de l'import des cartes manquantes:", error)
      throw error
    }
  }

  /**
   * Recherche et importe des cartes par nom
   */
  async searchAndImportCards(
    query: string,
    limit: number = 20
  ): Promise<{
    found: number
    imported: number
    cards: any[]
    errors: any[]
  }> {
    try {
      // Rechercher dans l'API
      const apiResponse = await this.scryfallProvider.searchCards(query)

      if (!apiResponse || !(apiResponse as any).data) {
        throw new Error('Erreur lors de la recherche')
      }

      const searchResults = (apiResponse as any).data
      const cardsToImport = searchResults.data.slice(0, limit)

      // Transformer et importer
      const transformedCards =
        this.scryfallAdapter.transformCards(cardsToImport)
      const importResult =
        await this.dbAdapter.bulkImportCards(transformedCards)

      return {
        found: searchResults.total_cards,
        imported: importResult.success,
        cards: transformedCards,
        errors: importResult.errors,
      }
    } catch (error) {
      console.error('Erreur lors de la recherche et import:', error)
      throw error
    }
  }

  /**
   * Met à jour les prix de toutes les cartes
   */
  async updateAllCardPrices(): Promise<{
    updated: number
    errors: any[]
  }> {
    try {
      // Récupérer toutes les cartes
      const allCards = await this.dbAdapter.getAllCards()

      const results = { updated: 0, errors: [] as any[] }

      // Mettre à jour les prix par lot (pour éviter de surcharger l'API)
      const batchSize = 10
      for (let i = 0; i < allCards.length; i += batchSize) {
        const batch = allCards.slice(i, i + batchSize)

        for (const card of batch) {
          try {
            // Récupérer les prix depuis l'API (méthode temporaire)
            // TODO: Implémenter fetchCardPrice dans ScryfallProvider
            const priceResponse = await this.scryfallProvider.fetchCard({
              cardId: card.externalId,
            })

            if (
              priceResponse &&
              priceResponse.data &&
              (priceResponse.data as any).prices
            ) {
              const prices = (priceResponse.data as any).prices
              const priceData: any = {}
              if (prices.usd) priceData.usd = parseFloat(prices.usd)
              if (prices.eur) priceData.eur = parseFloat(prices.eur)
              if (prices.tix) priceData.tix = parseFloat(prices.tix)

              await this.dbAdapter.updateCardPrices(card.externalId, priceData)
              results.updated++
            }
          } catch (error) {
            results.errors.push({
              externalId: card.externalId,
              error: error instanceof Error ? error.message : 'Erreur inconnue',
            })
          }
        }

        // Pause entre les lots pour respecter les rate limits
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      return results
    } catch (error) {
      console.error('Erreur lors de la mise à jour des prix:', error)
      throw error
    }
  }

  /**
   * Ajoute une carte à une collection et l'importe si nécessaire
   */
  async addCardToCollection(
    externalId: string,
    collectionId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; card?: any; error?: string }> {
    try {
      // D'abord, s'assurer que la carte est importée
      const importResult = await this.importCardById(externalId)
      if (!importResult.success) {
        return {
          success: false,
          error: importResult.error || 'Erreur inconnue',
        }
      }

      // Ajouter à la collection
      const card = await this.dbAdapter.addCardToCollection(
        externalId,
        collectionId,
        quantity
      )

      return { success: true, card }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la collection:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }
    }
  }

  /**
   * Ajoute une carte à une wishlist et l'importe si nécessaire
   */
  async addCardToWishlist(
    externalId: string,
    wishlistId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; card?: any; error?: string }> {
    try {
      // D'abord, s'assurer que la carte est importée
      const importResult = await this.importCardById(externalId)
      if (!importResult.success) {
        return {
          success: false,
          error: importResult.error || 'Erreur inconnue',
        }
      }

      // Ajouter à la wishlist
      const card = await this.dbAdapter.addCardToWishlist(
        externalId,
        wishlistId,
        quantity
      )

      return { success: true, card }
    } catch (error) {
      console.error("Erreur lors de l'ajout à la wishlist:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }
    }
  }

  /**
   * Ajoute une carte à un deck et l'importe si nécessaire
   */
  async addCardToDeck(
    externalId: string,
    deckId: string,
    quantity: number = 1
  ): Promise<{ success: boolean; card?: any; error?: string }> {
    try {
      // D'abord, s'assurer que la carte est importée
      const importResult = await this.importCardById(externalId)
      if (!importResult.success) {
        return {
          success: false,
          error: importResult.error || 'Erreur inconnue',
        }
      }

      // Ajouter au deck
      const card = await this.dbAdapter.addCardToDeck(
        externalId,
        deckId,
        quantity
      )

      return { success: true, card }
    } catch (error) {
      console.error("Erreur lors de l'ajout au deck:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }
    }
  }

  /**
   * Obtient les statistiques de la base de données
   */
  async getDatabaseStats(): Promise<{
    totalCards: number
    cardsByGameType: Record<string, number>
    cardsBySet: Record<string, number>
    missingCards: number
    collectionCards: number
    wishlistCards: number
    deckCards: number
  }> {
    try {
      return await this.dbAdapter.getDatabaseStats()
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  }

  /**
   * Ferme les connexions
   */
  async disconnect(): Promise<void> {
    await this.dbAdapter.disconnect()
  }
}
