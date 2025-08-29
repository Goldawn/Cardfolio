import { useMemo } from "react";

export function useLegalityIndex(legality) {
  const issuesById = useMemo(() => {
    const m = new Map();
    (legality?.issues || []).forEach(i => m.set(i.scryfallId, i.problems || []));
    return m;
  }, [legality]);

  const isCardProblematic = (card) => (issuesById.get(card?.id) || []).length > 0;

  return { issuesById, isCardProblematic };
}