import type { GameSet } from '@/card-api-service/dto'
import { prisma } from '@/lib/prisma'
import { useCallback, useEffect, useState } from 'react'

export function useSets() {
  const [sets, setSets] = useState<GameSet[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Charger tous les sets depuis la BDD
  const loadSets = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Récupérer les sets uniques depuis les cartes en BDD
      const setsData = await prisma.card.findMany({
        select: {
          setName: true,
          setCode: true,
        },
        distinct: ['setName', 'setCode'],
        where: {
          setName: { not: null },
          setCode: { not: null },
        },
      })

      // Transformer en format GameSet
      const gameSets: GameSet[] = setsData.map(set => ({
        id: set.setCode!,
        code: set.setCode!,
        name: set.setName!,
        releaseDate: '', // Pas stocké en BDD pour l'instant
        setType: 'expansion', // Par défaut
        cardCount: 0, // Pas stocké en BDD pour l'instant
        digital: false, // Par défaut
        parentSetCode: undefined,
      }))

      setSets(gameSets)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des sets'
      )
      console.error('Erreur lors du chargement des sets:', err)
    } finally {
      setLoading(false)
    }
  }, [])

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
        (sub: GameSet) =>
          !parentSets.some(
            (parent: GameSet) => parent.code === sub.parentSetCode
          )
      )
      .forEach((sub: GameSet) => structuredSets.push(sub))

    return structuredSets
  }

  return {
    sets,
    loading,
    error,
    loadSets,
    filterSetsByName,
  }
}
