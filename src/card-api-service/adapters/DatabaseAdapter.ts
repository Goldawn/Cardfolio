import type { MTGCard } from '@/types/games/magic'
import { PrismaClient } from '@prisma/client'

/**
 * Adaptateur pour importer les données de cartes depuis les APIs vers la base de données
 * Avec la nouvelle structure où Card remplace CollectionItem, WishlistItem et DeckCard
 */
export class DatabaseAdapter {
  private prisma: PrismaClient

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient()
  }

  /**
   * Importe une carte depuis les données API vers la base de données
   */
  async importCardFromAPI(cardData: MTGCard): Promise<any> {
    try {
      // Vérifier si la carte existe déjà
      const existingCard = await this.prisma.card.findUnique({
        where: { externalId: cardData.id },
      })

      if (existingCard) {
        // Mettre à jour la carte existante
        return await this.updateExistingCard(existingCard.id, cardData)
      }

      // Créer une nouvelle carte
      return await this.createNewCard(cardData)
    } catch (error) {
      console.error("Erreur lors de l'import de la carte:", error)
      throw error
    }
  }

  /**
   * Importe plusieurs cartes en lot
   */
  async bulkImportCards(
    cardsData: MTGCard[]
  ): Promise<{ success: number; errors: any[] }> {
    const results = { success: 0, errors: [] as any[] }

    for (const cardData of cardsData) {
      try {
        await this.importCardFromAPI(cardData)
        results.success++
      } catch (error) {
        results.errors.push({
          cardId: cardData.id,
          cardName: cardData.name,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      }
    }

    return results
  }

  /**
   * Crée une nouvelle carte en base
   */
  private async createNewCard(cardData: MTGCard): Promise<any> {
    const cardInput = this.transformCardDataToDbFormat(cardData)

    return await this.prisma.card.create({
      data: cardInput,
    })
  }

  /**
   * Met à jour une carte existante
   */
  private async updateExistingCard(
    cardId: string,
    cardData: MTGCard
  ): Promise<any> {
    const cardInput = this.transformCardDataToDbFormat(cardData)

    return await this.prisma.card.update({
      where: { id: cardId },
      data: {
        ...cardInput,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Transforme les données de carte API vers le format base de données
   */
  private transformCardDataToDbFormat(cardData: MTGCard): any {
    // Extraire les prix depuis priceHistory
    const latestPrice = cardData.priceHistory?.[0]

    return {
      externalId: cardData.id,
      name: cardData.name,
      gameType: cardData.gameType,
      setName: cardData.setName,
      setCode: cardData.setCode,
      collectorNumber: cardData.collectorNumber,
      lang: cardData.lang || 'en',
      rarity: cardData.rarity,
      artist: cardData.artist,

      // Images
      imageSmall: cardData.image?.small,
      imageNormal: cardData.image?.normal,
      imageLarge: cardData.image?.large,
      imageArtCrop: cardData.image?.artCrop,

      // Données de jeu
      gameData: cardData.gameData,
      colors: cardData.colors,
      cardType: cardData.gameData?.type || cardData.gameData?.typeLine,
      format: cardData.format,

      // Légalités
      legalities: cardData.legalities,

      // Prix
      priceUsd: latestPrice?.usd,
      priceEur: latestPrice?.eur,
      priceTix: undefined, // Pas disponible dans MTGCard actuel
      priceFoilUsd: undefined, // À implémenter si nécessaire
      priceFoilEur: undefined, // À implémenter si nécessaire
      lastPriceUpdate: latestPrice ? new Date(latestPrice.date) : new Date(),

      // Quantité et allocation (par défaut pour une nouvelle carte)
      quantity: cardData.quantity || 1,
      allocated: 0,
      dateAdded: new Date(),
      priceHistory: cardData.priceHistory || [],
    }
  }

  /**
   * Synchronise les cartes manquantes en identifiant les scryfallId référencés mais non présents
   */
  async syncMissingCards(): Promise<{ missing: string[]; total: number }> {
    try {
      // Récupérer tous les externalId référencés dans les collections, wishlists et decks
      const [collectionExternalIds, wishlistExternalIds, deckExternalIds] =
        await Promise.all([
          this.prisma.card.findMany({
            where: { collectionId: { not: null } },
            select: { externalId: true },
          }),
          this.prisma.card.findMany({
            where: { wishlistId: { not: null } },
            select: { externalId: true },
          }),
          this.prisma.card.findMany({
            where: { deckId: { not: null } },
            select: { externalId: true },
          }),
        ])

      // Compiler tous les externalId uniques
      const allReferencedIds = new Set([
        ...collectionExternalIds.map(card => card.externalId),
        ...wishlistExternalIds.map(card => card.externalId),
        ...deckExternalIds.map(card => card.externalId),
      ])

      // Récupérer tous les externalId présents en base
      const existingCards = await this.prisma.card.findMany({
        select: { externalId: true },
      })
      const existingIds = new Set(existingCards.map(card => card.externalId))

      // Identifier les cartes manquantes
      const missingIds = Array.from(allReferencedIds).filter(
        id => !existingIds.has(id)
      )

      return {
        missing: missingIds,
        total: allReferencedIds.size,
      }
    } catch (error) {
      console.error(
        'Erreur lors de la synchronisation des cartes manquantes:',
        error
      )
      throw error
    }
  }

  /**
   * Récupère une carte par son externalId
   */
  async getCardByExternalId(externalId: string): Promise<any | null> {
    return await this.prisma.card.findUnique({
      where: { externalId },
    })
  }

  /**
   * Récupère plusieurs cartes par leurs externalId
   */
  async getCardsByExternalIds(externalIds: string[]): Promise<any[]> {
    return await this.prisma.card.findMany({
      where: {
        externalId: {
          in: externalIds,
        },
      },
    })
  }

  /**
   * Récupère toutes les cartes (avec pagination)
   */
  async getAllCards(limit: number = 1000, offset: number = 0): Promise<any[]> {
    return await this.prisma.card.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Met à jour les prix d'une carte
   */
  async updateCardPrices(
    externalId: string,
    prices: {
      usd?: number
      eur?: number
      tix?: number
      foilUsd?: number
      foilEur?: number
    }
  ): Promise<any> {
    return await this.prisma.card.update({
      where: { externalId },
      data: {
        ...(prices.usd !== undefined && { priceUsd: prices.usd }),
        ...(prices.eur !== undefined && { priceEur: prices.eur }),
        ...(prices.tix !== undefined && { priceTix: prices.tix }),
        ...(prices.foilUsd !== undefined && { priceFoilUsd: prices.foilUsd }),
        ...(prices.foilEur !== undefined && { priceFoilEur: prices.foilEur }),
        lastPriceUpdate: new Date(),
      },
    })
  }

  /**
   * Recherche des cartes par nom (avec pagination)
   */
  async searchCardsByName(
    name: string,
    gameType?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ cards: any[]; total: number }> {
    const where = {
      name: {
        contains: name,
        mode: 'insensitive' as const,
      },
      ...(gameType && { gameType }),
    }

    const [cards, total] = await Promise.all([
      this.prisma.card.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
      }),
      this.prisma.card.count({ where }),
    ])

    return { cards, total }
  }

  /**
   * Ajoute une carte à une collection
   */
  async addCardToCollection(
    externalId: string,
    collectionId: string,
    quantity: number = 1
  ): Promise<any> {
    // Vérifier si la carte existe déjà dans cette collection
    const existingCard = await this.prisma.card.findFirst({
      where: {
        externalId,
        collectionId,
      },
    })

    if (existingCard) {
      // Mettre à jour la quantité
      return await this.prisma.card.update({
        where: { id: existingCard.id },
        data: {
          quantity: existingCard.quantity + quantity,
          updatedAt: new Date(),
        },
      })
    } else {
      // Créer une nouvelle entrée
      return await this.prisma.card.create({
        data: {
          externalId,
          collectionId,
          quantity,
          // Les autres champs seront remplis lors de l'import de la carte
          name: 'Temporary', // Sera mis à jour lors de l'import
          gameType: 'magic',
          gameData: {},
        },
      })
    }
  }

  /**
   * Ajoute une carte à une wishlist
   */
  async addCardToWishlist(
    externalId: string,
    wishlistId: string,
    quantity: number = 1
  ): Promise<any> {
    // Vérifier si la carte existe déjà dans cette wishlist
    const existingCard = await this.prisma.card.findFirst({
      where: {
        externalId,
        wishlistId,
      },
    })

    if (existingCard) {
      // Mettre à jour la quantité
      return await this.prisma.card.update({
        where: { id: existingCard.id },
        data: {
          quantity: existingCard.quantity + quantity,
          updatedAt: new Date(),
        },
      })
    } else {
      // Créer une nouvelle entrée
      return await this.prisma.card.create({
        data: {
          externalId,
          wishlistId,
          quantity,
          // Les autres champs seront remplis lors de l'import de la carte
          name: 'Temporary', // Sera mis à jour lors de l'import
          gameType: 'magic',
          gameData: {},
        },
      })
    }
  }

  /**
   * Ajoute une carte à un deck
   */
  async addCardToDeck(
    externalId: string,
    deckId: string,
    quantity: number = 1
  ): Promise<any> {
    // Vérifier si la carte existe déjà dans ce deck
    const existingCard = await this.prisma.card.findFirst({
      where: {
        externalId,
        deckId,
      },
    })

    if (existingCard) {
      // Mettre à jour la quantité
      return await this.prisma.card.update({
        where: { id: existingCard.id },
        data: {
          quantity: existingCard.quantity + quantity,
          updatedAt: new Date(),
        },
      })
    } else {
      // Créer une nouvelle entrée
      return await this.prisma.card.create({
        data: {
          externalId,
          deckId,
          quantity,
          // Les autres champs seront remplis lors de l'import de la carte
          name: 'Temporary', // Sera mis à jour lors de l'import
          gameType: 'magic',
          gameData: {},
        },
      })
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
      const { missing } = await this.syncMissingCards()

      const [
        totalCards,
        cardsByGameType,
        cardsBySet,
        collectionCards,
        wishlistCards,
        deckCards,
      ] = await Promise.all([
        this.prisma.card.count(),
        this.prisma.card.groupBy({
          by: ['gameType'],
          _count: { gameType: true },
        }),
        this.prisma.card.groupBy({
          by: ['setCode'],
          _count: { setCode: true },
        }),
        this.prisma.card.count({ where: { collectionId: { not: null } } }),
        this.prisma.card.count({ where: { wishlistId: { not: null } } }),
        this.prisma.card.count({ where: { deckId: { not: null } } }),
      ])

      return {
        totalCards,
        cardsByGameType: cardsByGameType.reduce(
          (acc, item) => {
            acc[item.gameType] = item._count.gameType
            return acc
          },
          {} as Record<string, number>
        ),
        cardsBySet: cardsBySet.reduce(
          (acc, item) => {
            if (item.setCode) acc[item.setCode] = item._count.setCode
            return acc
          },
          {} as Record<string, number>
        ),
        missingCards: missing.length,
        collectionCards,
        wishlistCards,
        deckCards,
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      throw error
    }
  }

  /**
   * Ferme la connexion Prisma
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
  }
}
