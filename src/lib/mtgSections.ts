// /lib/mtgSections.ts
import { GameCard, MTG_BUCKETS, MTG_COLOR_ORDER, MTG_TYPE_ORDER } from '@/types'
import { isMTGCard } from '@/types/utils/guards'
import {
  bucketLabel,
  colorBucketOf,
  getMV,
  isLand,
  primaryTypeOf,
} from './mtgCards'
import { sortByMVThenName, sortByName } from './mtgSorts'

export const buildNameList = (cards: GameCard[] = []): GameCard[] =>
  cards
    .filter(c => Number(c?.quantity || 0) > 0)
    .slice()
    .sort(sortByName)

export interface Section {
  key: string
  title: string
  items: GameCard[]
}

export interface SectionResult {
  sections: Section[]
  lands: GameCard[]
}

/**
 * Helper générique pour créer des sections groupées
 * Utilise les types existants de @types/utils pour la cohérence
 */
function buildGenericSections<T extends string>(
  cards: GameCard[],
  groupBy: (card: GameCard) => T,
  order: readonly T[],
  sectionKey: string,
  sectionTitle: (key: T) => string,
  sortFn: (a: GameCard, b: GameCard) => number = sortByName
): SectionResult {
  const map = new Map<T, GameCard[]>(order.map(k => [k, [] as GameCard[]]))
  const lands: GameCard[] = []

  // Filtrer et grouper les cartes (seulement les cartes MTG)
  for (const card of cards) {
    if (!isMTGCard(card)) continue

    const qty = Number(card?.quantity || 0)
    if (!qty) continue

    if (isLand(card)) {
      lands.push(card)
      continue
    }

    const key = groupBy(card)
    const arr = map.get(key)
    if (arr) arr.push(card)
  }

  // Trier chaque groupe
  for (const key of map.keys()) {
    const arr = map.get(key)
    if (arr) arr.sort(sortFn)
  }

  // Créer les sections
  const sections = order
    .map(key => ({
      key: `${sectionKey}-${key}`,
      title: sectionTitle(key),
      items: map.get(key) || [],
    }))
    .filter(s => s.items.length > 0)

  return {
    sections,
    lands: lands.sort(sortFn),
  }
}

export const buildMvSections = (cards: GameCard[] = []): SectionResult =>
  buildGenericSections(
    cards,
    c => bucketLabel(getMV(c)),
    MTG_BUCKETS,
    'mv',
    b => `Coût ${b}`,
    sortByName
  )

export const buildTypeSections = (cards: GameCard[] = []): SectionResult =>
  buildGenericSections(
    cards,
    primaryTypeOf,
    MTG_TYPE_ORDER.filter(k => k !== 'land'),
    'type',
    t => t,
    sortByMVThenName
  )

export const buildColorSections = (cards: GameCard[] = []): SectionResult =>
  buildGenericSections(
    cards,
    colorBucketOf,
    MTG_COLOR_ORDER,
    'color',
    c => c,
    sortByMVThenName
  )
