// services/wishlistMissing.js
export function computeMissingFromDeck(deckCards = [], collectionItems = []) {
  const have = new Map(collectionItems.map(i => [i.scryfallId, i.quantity || 0]));
  const out = [];
  for (const dc of deckCards) {
    const want = dc.quantity || 0;
    const got = have.get(dc.scryfallId) || 0;
    const missing = Math.max(0, want - got);
    if (missing > 0) {
      out.push({ scryfallId: dc.scryfallId, quantity: missing });
    }
  }
  return out; // [{ scryfallId, quantity }]
}
