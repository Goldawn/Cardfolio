import { getMV } from '@/lib/mtgCards'

export const sortByName = (a: any, b: any): number =>
  String(a.name || a.printedName).localeCompare(
    String(b.name || b.printedName),
    'fr',
    { sensitivity: 'base' }
  )

export const sortByMVThenName = (a: any, b: any): number =>
  Number(a.mv ?? a.manaValue ?? getMV(a)) -
    Number(b.mv ?? b.manaValue ?? getMV(b)) || sortByName(a, b)

// Petit util split (round-robin)
export const splitIntoN = <T>(arr: T[], n: number): T[][] => {
  const buckets = Array.from({ length: Math.max(1, n | 0) }, () => [] as T[])
  arr.forEach((x, i) => buckets[i % buckets.length].push(x))
  return buckets
}
