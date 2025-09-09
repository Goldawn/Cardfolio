// services/wishlistMissing.ts
interface DeckCard {
  scryfallId: string
  quantity: number
}

interface CollectionItem {
  scryfallId: string
  quantity: number
}

interface MissingCard {
  scryfallId: string
  quantity: number
}

export function computeMissingFromDeck(deckCards: DeckCard[] = [], collectionItems: CollectionItem[] = []): MissingCard[] {
  const have = new Map(
    collectionItems.map(i => [i.scryfallId, i.quantity || 0])
  )
  const out: MissingCard[] = []
  for (const dc of deckCards) {
    const want = dc.quantity || 0
    const got = have.get(dc.scryfallId) || 0
    const missing = Math.max(0, want - got)
    if (missing > 0) {
      out.push({ scryfallId: dc.scryfallId, quantity: missing })
    }
  }
  return out // [{ scryfallId, quantity }]
}
