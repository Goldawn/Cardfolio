/**
 * ⚠️  FICHIER PARTIELLEMENT REFACTORISÉ
 * Ce fichier contient encore du code mort qui doit être migré vers Prisma
 * TODO: Remplacer tous les appels API par des requêtes Prisma directes
 */

// CardApiManager supprimé - utiliser Prisma directement'
import type { GameSet } from '@/card-api-service/dto'
import type { MTGCard } from '@/types/games/magic'
import { useCallback, useMemo, useState } from 'react'

export function useCards() {
  const [cards, setCards] = useState<MTGCard[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Instance du service Card API
  const cardService = useMemo(() => /* TODO: Remplacer par Prisma */ cardApiManager.getCardService(), [])

  // Charger les cartes d'un set
  const loadSetCards = useCallback(
    async (selectedSet: GameSet) => {
      if (!selectedSet.code) return

      setLoading(true)
      setError(null)
      try {
        const cards = await cardService.fetchSetCards({
          setCode: selectedSet.code,
          language: 'en',
          options: {
            fetchAllPages: false,
          },
        })
        setCards(cards)
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
    },
    [cardService]
  )

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
