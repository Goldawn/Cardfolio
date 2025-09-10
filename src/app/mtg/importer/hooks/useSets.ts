import { useState, useEffect, useMemo, useCallback } from 'react'
import { CardServiceFactory } from '@/card-api-service'
import type { GameSet } from '@/card-api-service/dto'

export function useSets() {
  const [sets, setSets] = useState<GameSet[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Instance du service Card API
  const cardService = useMemo(() => CardServiceFactory.create(), [])

  // Charger tous les sets
  const loadSets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const allSets = await cardService.fetchSets()
      setSets(allSets)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des sets'
      setError(errorMessage)
      console.error('Erreur lors du chargement des sets:', err)
    } finally {
      setLoading(false)
    }
  }, [cardService])

  // Charger les sets au montage du composant
  useEffect(() => {
    loadSets()
  }, [loadSets])

  // Filtrer les sets par nom
  const filterSetsByName = (query: string): GameSet[] => {
    if (query.length <= 2) return []
    
    const matchingSets = sets.filter((set: GameSet) =>
      set.name.toLowerCase().includes(query.toLowerCase())
    )

    // Structurer les sets (parents et sous-sets)
    const structuredSets: GameSet[] = []
    const parentSets = matchingSets.filter((set: GameSet) => !set.parentSetCode)
    const subSets = matchingSets.filter((set: GameSet) => set.parentSetCode)

    // Ajouter les parents avec leurs sous-sets
    parentSets.forEach((parent: GameSet) => {
      structuredSets.push(parent)
      subSets
        .filter((sub: GameSet) => sub.parentSetCode === parent.code)
        .forEach((sub: GameSet) => structuredSets.push(sub))
    })

    // Ajouter les sous-sets orphelins
    subSets
      .filter(
        (sub: GameSet) => !parentSets.some((parent: GameSet) => parent.code === sub.parentSetCode)
      )
      .forEach((sub: GameSet) => structuredSets.push(sub))

    return structuredSets
  }

  return {
    sets,
    loading,
    error,
    loadSets,
    filterSetsByName
  }
}
