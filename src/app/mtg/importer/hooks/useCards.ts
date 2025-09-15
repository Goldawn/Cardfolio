import type { GameCard } from '@/types/utils/guards'
import { useCallback, useState } from 'react'

export function useCards() {
  const [cards, setCards] = useState<GameCard[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Charger les cartes d'un set avec Prisma
  const loadSetCards = useCallback(async (selectedSet: { code: string }) => {
    if (!selectedSet.code) return

    setLoading(true)
    setError(null)
    try {
      // Recherche des cartes du set via l'API
      const response = await fetch(`/api/mtg/cards?setCode=${selectedSet.code}`)
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      setCards(data.cards)
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
