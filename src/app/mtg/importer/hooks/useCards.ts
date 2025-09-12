import { prisma } from '@/lib/prisma'
import type { MTGCard } from '@/types/games/magic'
import { useCallback, useState } from 'react'

export function useCards() {
  const [cards, setCards] = useState<MTGCard[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Charger les cartes d'un set avec Prisma
  const loadSetCards = useCallback(async (selectedSet: { code: string }) => {
    if (!selectedSet.code) return

    setLoading(true)
    setError(null)
    try {
      // Recherche des cartes du set avec Prisma
      const results = await prisma.card.findMany({
        where: {
          setCode: selectedSet.code,
        },
        select: {
          id: true,
          externalId: true,
          name: true,
          gameType: true,
          gameData: true,
          imageSmall: true,
          imageNormal: true,
          imageLarge: true,
          setCode: true,
          setName: true,
          rarity: true,
          artist: true,
          collectorNumber: true,
        },
        take: 100, // Limiter les résultats
      })

      // Transformer les résultats pour correspondre au format MTGCard
      const formattedCards = results.map(
        card =>
          ({
            id: card.externalId,
            externalId: card.externalId,
            name: card.name,
            gameType: card.gameType,
            setCode: card.setCode,
            setName: card.setName,
            rarity: card.rarity,
            artist: card.artist,
            collectorNumber: card.collectorNumber,
            gameData: card.gameData as any,
            image: card.imageLarge || card.imageNormal || card.imageSmall || '',
            imageSmall: card.imageSmall,
            imageNormal: card.imageNormal,
            imageLarge: card.imageLarge,
          }) as unknown as MTGCard
      )

      setCards(formattedCards)
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des cartes'
      setError(errorMessage)
      console.error('Erreur lors du chargement des cartes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Réinitialiser les cartes
  const clearCards = useCallback(() => {
    setCards([])
    setError(null)
  }, [])

  return {
    cards,
    loading,
    error,
    loadSetCards,
    clearCards,
  }
}
