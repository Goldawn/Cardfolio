// /lib/mtgSections.ts
import { MTGCard, MTG_BUCKETS, MTG_COLOR_ORDER, MTG_TYPE_ORDER } from '@/types'
import {
  bucketLabel,
  colorBucketOf,
  getMV,
  isLand,
  primaryTypeOf,
} from './mtgCards'
import { sortByMVThenName, sortByName } from './mtgSorts'

export const buildNameList = (cards: MTGCard[] = []): MTGCard[] =>
  cards
    .filter(c => Number(c?.quantity || 0) > 0)
    .slice()
    .sort(sortByName)

export interface Section {
  key: string
  title: string
  items: MTGCard[]
}

export interface SectionResult {
  sections: Section[]
  lands: MTGCard[]
}

/**
 * Helper générique pour créer des sections groupées
 * Utilise les types existants de @types/utils pour la cohérence
 */
function buildGenericSections<T extends string>(
  cards: MTGCard[],
  groupBy: (card: MTGCard) => T,
  order: readonly T[],
  sectionKey: string,
  sectionTitle: (key: T) => string,
  sortFn: (a: MTGCard, b: MTGCard) => number = sortByName
): SectionResult {
  const map = new Map<T, MTGCard[]>(order.map(k => [k, [] as MTGCard[]]))
  const lands: MTGCard[] = []

  // Filtrer et grouper les cartes
  for (const card of cards) {
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

export const buildMvSections = (cards: MTGCard[] = []): SectionResult =>
  buildGenericSections(
    cards,
    c => bucketLabel(getMV(c)),
    MTG_BUCKETS,
    'mv',
    b => `Coût ${b}`,
    sortByName
  )

export const buildTypeSections = (cards: MTGCard[] = []): SectionResult =>
  buildGenericSections(
    cards,
    primaryTypeOf,
    MTG_TYPE_ORDER.filter(k => k !== 'land'),
    'type',
    t => t,
    sortByMVThenName
  )

export const buildColorSections = (cards: MTGCard[] = []): SectionResult =>
  buildGenericSections(
    cards,
    colorBucketOf,
    MTG_COLOR_ORDER,
    'color',
    c => c,
    sortByMVThenName
  )
