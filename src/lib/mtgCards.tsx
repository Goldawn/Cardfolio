// Normalized MTG card helpers — single source of truth
// ----------------------------------------------------
import {
  CMCBucket,
  CardRarity,
  MTGCardType,
  MTGColor,
  MTG_BUCKETS,
  MTG_COLOR_ORDER,
  MTG_TYPE_ORDER,
} from '@/types'
import { ReactNode } from 'react'
import manaSymbols from '../app/assets/mock/mana.json'

/** ------- Mana helpers ------- **/

/**
 * Calcule le CMC numérique à partir d'une string "{...}".
 * - Nombres => valeur
 * - Hybrides/Phyrexian/Non numériques => 1
 * - X/Y/Z => 0
 */
export function parseManaCostNumeric(manaCost?: string | null): number {
  if (!manaCost) return 0
  const tokens = String(manaCost).match(/\{[^}]+\}/g) || []
  let sum = 0
  for (const tok of tokens) {
    const sym = tok.slice(1, -1).toUpperCase().trim()
    if (/^\d+$/.test(sym)) {
      sum += Number(sym)
    } else if (sym.includes('/')) {
      // ex: {W/U}, {2/W}, {W/P}...
      const parts = sym.split('/')
      const numeric = parts.find(p => /^\d+$/.test(p))
      sum += numeric ? Number(numeric) : 1
    } else if (sym === 'X' || sym === 'Y' || sym === 'Z') {
      sum += 0
    } else {
      sum += 1
    }
  }
  return sum
}

/**
 * Rend le coût de mana en icônes (conserve la compat avec l'ancien formatAndParseText).
 */
export function renderManaCost(manaCost?: string | null): ReactNode {
  if (!manaCost) return null
  return String(manaCost)
    .split('\n')
    .map((line, lineIndex) => (
      <span key={lineIndex}>
        {line
          .split(/(\{[^}]+\})/g)
          .filter(Boolean)
          .map((symbol, symbolIndex) => {
            const found = (manaSymbols?.data || []).find(
              e => e.symbol === symbol
            )
            return found ? (
              <img
                key={`${lineIndex}-${symbolIndex}`}
                src={found.svg_uri}
                alt={symbol}
              />
            ) : (
              symbol
            )
          })}
        <br />
      </span>
    ))
}

export const formatAndParseText = (text?: string | null): ReactNode => {
  if (!text) return null
  return text.split('\n').map((line, lineIndex) => (
    <span key={lineIndex}>
      {line
        .split(/(\{[^}]+\})/g)
        .filter(Boolean)
        .map((symbol, symbolIndex) => {
          const foundSymbol = manaSymbols.data.find(
            entry => entry.symbol === symbol
          )
          return foundSymbol ? (
            <img
              key={`${lineIndex}-${symbolIndex}`}
              src={foundSymbol.svg_uri}
              alt={symbol}
            />
          ) : (
            symbol
          )
        })}
      <br />
    </span>
  ))
}

/**
 * MV/CMC d'une carte (prend les champs numériques si présents, sinon parse la string de mana).
 */
export function getMV(card: any): number {
  const cand = [card?.manaValue, card?.cmc, card?.convertedManaCost].find(
    v => v !== undefined && v !== null && Number.isFinite(Number(v))
  )
  if (cand !== undefined) return Math.max(0, Math.floor(Number(cand)))
  return Math.max(0, Math.floor(parseManaCostNumeric(card?.manaCost)))
}

/** Buckets CMC utilisés partout */
export const BUCKETS = MTG_BUCKETS

/**
 * Label de bucket pour un MV.
 */
export function bucketLabel(mv: number): CMCBucket {
  return mv <= 1 ? '1-' : mv >= 7 ? '7+' : (String(mv) as CMCBucket)
}

/** ------- Type helpers ------- **/

export const TYPE_ORDER = MTG_TYPE_ORDER

/**
 * Type principal (catégories cohérentes avec l'UI).
 */
export function primaryTypeOf(card: any): MTGCardType {
  const t = (card?.type || card?.typeLine || '').toLowerCase()
  if (t.includes('land')) return 'land'
  if (t.includes('creature')) return 'creature'
  if (t.includes('instant')) return 'instant'
  if (t.includes('sorcery')) return 'sorcery'
  if (t.includes('enchantment')) return 'enchantment'
  if (t.includes('artifact')) return 'artifact'
  if (t.includes('planeswalker')) return 'planeswalker'
  if (t.includes('battle')) return 'battle'
  return 'other'
}

export const isLand = (card: any): boolean => primaryTypeOf(card) === 'land'

/** ------- Color helpers ------- **/

export const COLOR_ORDER = MTG_COLOR_ORDER

/**
 * Extrait W/U/B/R/G d'une string de mana (hybrides compris).
 */
export function colorsFromManaCost(manaCost?: string | null): MTGColor[] {
  if (!manaCost) return []
  const tokens = String(manaCost).match(/\{[^}]+\}/g) || []
  const set = new Set<MTGColor>()
  for (const tok of tokens) {
    const sym = tok.slice(1, -1).toUpperCase()
    if (['W', 'U', 'B', 'R', 'G'].includes(sym)) set.add(sym as MTGColor)
    sym.split('/').forEach(s => {
      if (['W', 'U', 'B', 'R', 'G'].includes(s)) set.add(s as MTGColor)
    })
  }
  return Array.from(set)
}

/**
 * Bucket de couleur (W/U/B/R/G/M/C) avec priorité :
 * colors → colorIdentity/color_identity → manaCost → C
 */
export function colorBucketOf(card: any): MTGColor {
  let cols: string[] = []
  if (Array.isArray(card?.colors) && card.colors.length) cols = card.colors
  else if (Array.isArray(card?.colorIdentity) && card.colorIdentity.length)
    cols = card.colorIdentity
  else if (Array.isArray(card?.color_identity) && card.color_identity.length)
    cols = card.color_identity
  else cols = colorsFromManaCost(card?.manaCost)

  const norm = cols
    .map(String)
    .map(c => c.toUpperCase())
    .filter(c => ['W', 'U', 'B', 'R', 'G'].includes(c))

  if (norm.length === 0) return 'C'
  if (norm.length >= 2) return 'M'
  return norm[0] as MTGColor
}

/** ------- Rarity helpers ------- **/

/**
 * Extrait la rareté normalisée d'une carte
 */
export function rarityKeyOf(card: any): CardRarity {
  const r = (card?.rarity || card?.printedRarity || card?.rarityKey || '')
    .toString()
    .toLowerCase()
    .trim()

  if (r === 'common') return 'common'
  if (r === 'uncommon') return 'uncommon'
  if (r === 'rare') return 'rare'
  if (r === 'mythic' || r === 'mythic rare') return 'mythic'
  if (r === 'special' || r === 'bonus' || r === 'timeshifted') return 'special'
  return 'other'
}

/** ------- Images / Showcase helpers ------- **/

/**
 * Image petite (pour table / list).
 */
export function getArtSmall(card: any): string | null {
  return (
    card?.image?.artCrop ||
    card?.cardBack?.image?.artCrop ||
    card?.image?.normal ||
    null
  )
}

/**
 * Image grande (pour preview hover).
 */
export function getArtLarge(card: any): string | null {
  return (
    card?.image?.large ||
    card?.image?.normal ||
    card?.image?.artCrop ||
    card?.cardBack?.image?.artCrop ||
    null
  )
}

/** ------- Tiny utils ------- **/

export const getName = (card: any): string =>
  String(card?.name || card?.printedName || '')

export const getQty = (card: any): number => Number(card?.decklistQuantity || 0)

/** ------- Default export (optionnel) ------- **/
export default {
  // mana
  parseManaCostNumeric,
  renderManaCost,
  getMV,
  BUCKETS,
  bucketLabel,
  // type
  primaryTypeOf,
  isLand,
  TYPE_ORDER,
  // color
  colorsFromManaCost,
  colorBucketOf,
  COLOR_ORDER,
  // rarity
  rarityKeyOf,
  // images
  getArtSmall,
  getArtLarge,
  // tiny utils
  getName,
  getQty,
}
