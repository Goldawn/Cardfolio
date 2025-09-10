import { useState, useEffect, useCallback } from 'react'
import { useSets as useSetsHook } from '@/app/hooks/useCardApi'
import type { GameSet } from '@/card-api-service/dto'

export function useSets() {
  const { sets, loading, error, refetch } = useSetsHook()

  // Charger tous les sets
  const loadSets = useCallback(async () => {
    await refetch()
  }, [refetch])

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
