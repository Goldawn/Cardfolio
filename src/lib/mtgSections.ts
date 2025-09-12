// /lib/mtgSections.ts
import {
  BUCKETS,
  TYPE_ORDER,
  COLOR_ORDER,
  getMV,
  isLand,
  primaryTypeOf,
  colorBucketOf,
  bucketLabel, // ✅ import ajouté
} from './mtgCards'
import { sortByName, sortByMVThenName } from './mtgSorts'
import { MTGCard, MTGColor, MTGCardType } from '@/types'

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

export const buildMvSections = (cards: MTGCard[] = []): SectionResult => {
  const map = new Map<string, MTGCard[]>(BUCKETS.map(b => [b, [] as MTGCard[]]))
  const lands: MTGCard[] = []

  for (const c of cards) {
    const qty = Number(c?.quantity || 0)
    if (!qty) continue

    if (isLand(c)) {
      lands.push(c)
      continue
    }

    const b = bucketLabel(getMV(c)) // "1-" | "2" | ... | "7+"
    if (!map.has(b)) map.set(b, []) // garde-fou si jamais
    map.get(b)!.push(c)
  }

  for (const b of map.keys()) map.get(b)!.sort(sortByName)

  const sections = BUCKETS.map(b => ({
    key: `mv-${b}`,
    title: `Coût ${b}`,
    items: map.get(b) || [],
  })).filter(s => s.items.length)

  return { sections, lands: lands.sort(sortByName) }
}

export const buildTypeSections = (cards: MTGCard[] = []): SectionResult => {
  const map = new Map<MTGCardType, MTGCard[]>()

  for (const c of cards) {
    const qty = Number(c?.quantity || 0)
    if (!qty) continue
    const k = primaryTypeOf(c)
    const arr = map.get(k) || []
    arr.push(c)
    map.set(k, arr)
  }

  for (const k of map.keys()) map.get(k)!.sort(sortByMVThenName)

  const sections = TYPE_ORDER.filter(k => k !== 'land')
    .map(k => ({ key: `type-${k}`, title: k, items: map.get(k) || [] }))
    .filter(s => s.items.length)

  const lands = (map.get('land') || []).slice().sort(sortByMVThenName)

  return { sections, lands }
}

export const buildColorSections = (cards: MTGCard[] = []): SectionResult => {
  const map = new Map<MTGColor, MTGCard[]>(
    COLOR_ORDER.map(k => [k, [] as MTGCard[]])
  )
  const lands: MTGCard[] = []

  for (const c of cards) {
    const qty = Number(c?.quantity || 0)
    if (!qty) continue

    if (isLand(c)) {
      lands.push(c)
      continue
    }
    map.get(colorBucketOf(c))!.push(c) // W/U/B/R/G/M/C
  }

  for (const k of map.keys()) map.get(k)!.sort(sortByMVThenName)
  lands.sort(sortByMVThenName)

  const sections = COLOR_ORDER.map(k => ({
    key: `color-${k}`,
    title: k,
    items: map.get(k) || [],
  })).filter(s => s.items.length)

  return { sections, lands }
}
