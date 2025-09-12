import { useMemo } from 'react'
import type { GameCard } from '@/types'

interface LegalityIssue {
  externalId: string
  problems: string[]
}

interface Legality {
  issues: LegalityIssue[]
}

export function useLegalityIndex(legality: Legality | null) {
  const issuesById = useMemo(() => {
    const m = new Map<string, string[]>()
    ;(legality?.issues || []).forEach(i =>
      m.set(i.externalId, i.problems || [])
    )
    return m
  }, [legality])

  const isCardProblematic = (card: GameCard): boolean => (issuesById.get(card?.id) || []).length > 0

  return { issuesById, isCardProblematic }
}
