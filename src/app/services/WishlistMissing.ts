// services/wishlistMissing.ts
import type { AppDeckCard, AppCollectionItem } from '@/types'

interface MissingCard {
  externalId: string
  quantity: number
}

export function computeMissingFromDeck(deckCards: AppDeckCard[] = [], collectionItems: AppCollectionItem[] = []): MissingCard[] {
  const have = new Map(
    collectionItems.map(i => [i.externalId, i.quantity || 0])
  )
  const out: MissingCard[] = []
  for (const dc of deckCards) {
    const want = dc.quantity || 0
    const got = have.get(dc.externalId) || 0
    const missing = Math.max(0, want - got)
    if (missing > 0) {
      out.push({ externalId: dc.externalId, quantity: missing })
    }
  }
  return out // [{ externalId, quantity }]
}
