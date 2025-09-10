// services/legalities.ts

import type { MTGFormat } from '@/types/games/magic'

/** =========================
 *  Formats & règles de base
 *  ========================= */
export const SINGLETON_FORMATS = new Set<MTGFormat>([
  'commander',
  'paupercommander',
  'brawl',
  'standardbrawl',
  'gladiator',
  'oathbreaker',
])

export const MIN_SIZE_BY_FORMAT: Record<MTGFormat, number> = {
  commander: 100,
  paupercommander: 100,
  oathbreaker: 60,
  brawl: 60,
  standardbrawl: 60,
  gladiator: 100,
  // défaut: 60 pour les autres (modern, legacy, standard, pioneer, etc.)
  standard: 60,
  modern: 60,
  legacy: 60,
  vintage: 60,
  pioneer: 60,
  historic: 60,
  timeless: 60,
  alchemy: 60,
  penny: 60,
}

/** Cartes avec copies "spéciales" (ignore 4× ou limite spécifique) - source : https://mtg.fandom.com/wiki/Relentless  */
export const SPECIAL_COPIES_RULES: Record<string, number> = {
  // White
  'hare apparent': Infinity,
  'templar knight': Infinity,
  'tempest hawk': Infinity,

  // Blue
  'persistent petitioners': Infinity,

  // Black
  nazgûl: 9,
  'rat colony': Infinity,
  'relentless rats': Infinity,
  'shadowborn apostle': Infinity,

  // Red
  "dragon's approach": Infinity,
  'seven dwarves': 7,

  // Green
  'slime against humanity': Infinity,
}

interface DeckCard {
  id: string
  scryfallId: string
  quantity: number
}

interface EnrichedCard {
  id: string
  name: string
  type?: string
  legalities?: Record<string, string>
  rarity?: string
}

interface LegalityIssue {
  scryfallId: string
  name: string
  qty: number
  problems: string[]
}

interface DeckLegalityResult {
  format: string
  total: number
  minRequired: number
  sizeOk: boolean
  isSingleton: boolean
  issues: LegalityIssue[]
}

interface RarityCheckOptions {
  format: string
  enriched: EnrichedCard[]
  countsByCard: Map<string, number>
  commanderScryfallId?: string | null
}

/** =========================
 *  Helpers
 *  ========================= */
export const canonicalName = (c: { name?: string }): string => (c?.name ?? '').toLowerCase()

export const isBasicLand = (card: { type?: string }): boolean =>
  typeof card?.type === 'string' && /(^|\s)basic\s+land(\s|$)/i.test(card.type)

/**
 * Retourne le nombre max de copies autorisées pour cette carte,
 * en fonction du format, de la rareté "restricted" Vintage, et des exceptions "relentless".
 * - Terrains de base : illimités
 * - Singleton : 1
 * - Vintage restricted : 1
 * - Exceptions : Infinity / quota spécial
 * - Sinon : 4
 */
export function getAllowedCopies(card: { name?: string; type?: string }, format: string, leg: string): number {
  if (isBasicLand(card)) return Infinity
  if (SINGLETON_FORMATS.has(format as MTGFormat)) return 1
  if (format === 'vintage' && leg === 'restricted') return 1

  const special = SPECIAL_COPIES_RULES[canonicalName(card)]
  if (typeof special === 'number') return special

  return 4
}

/** =========================
 *  Règles de rareté (best effort)
 *  =========================
 * Pauper (classique) : toutes les cartes doivent exister en "common" (côté Scryfall: card.rarity === 'common')
 * Pauper Commander : idem, mais EXCEPTION possible pour le commandant (souvent uncommon).
 *  -> Sans "commanderId" explicite côté data, on propose 2 modes :
 *     - strict: toutes common
 *     - commanderException: on ignore 1 carte non-common si vous la désignez en amont (param).
 */
export function checkRarityRules({
  format,
  enriched,
  countsByCard,
  commanderScryfallId = null,
}: RarityCheckOptions): LegalityIssue[] {
  const issues: LegalityIssue[] = []

  // helper: check si une carte (cette impression) est common
  const isCommon = (c: { rarity?: string }): boolean => (c?.rarity || '').toLowerCase() === 'common'

  if (format === 'pauper') {
    enriched.forEach(c => {
      const qty = countsByCard.get(c.id) || 0
      if (qty > 0 && !isCommon(c)) {
        issues.push({
          scryfallId: c.id,
          name: c.name,
          qty,
          problems: ['Pauper: doit être commune'],
        })
      }
    })
  }

  if (format === 'paupercommander') {
    // Mode simple par défaut: toutes common.
    // Si vous gérez un commandant explicitement, passez commanderScryfallId pour l'exempter.
    enriched.forEach(c => {
      const qty = countsByCard.get(c.id) || 0
      if (qty === 0) return
      if (commanderScryfallId && c.id === commanderScryfallId) return // exception commandant
      if (!isCommon(c)) {
        issues.push({
          scryfallId: c.id,
          name: c.name,
          qty,
          problems: ['Pauper Commander: doit être commune (hors commandant)'],
        })
      }
    })
  }

  return issues
}

/** =========================
 *  Évaluation globale
 *  =========================
 * @param deck     { id, format, ... }
 * @param deckCards [{ id, scryfallId, quantity }, ...]
 * @param enriched  cartes enrichies formatCard() (id==scryfallId, name, type, legalities, rarity, ...)
 * @param opts { commanderScryfallId?: string | null }
 */
export function evaluateDeckLegality(
  deck: { format?: string },
  deckCards: DeckCard[],
  enriched: EnrichedCard[],
  opts: { commanderScryfallId?: string | null } = {}
): DeckLegalityResult {
  const format = (deck?.format || 'commander').toLowerCase()

  const total = deckCards.reduce((sum, dc) => sum + (dc.quantity || 0), 0)
  const minRequired = MIN_SIZE_BY_FORMAT[format as MTGFormat] ?? 60

  // Compteurs
  const countsByCard = new Map<string, number>() // scryfallId -> qty
  deckCards.forEach(dc =>
    countsByCard.set(
      dc.scryfallId,
      (countsByCard.get(dc.scryfallId) || 0) + (dc.quantity || 0)
    )
  )

  const countsByName = new Map<string, number>() // nom canonique -> total qty (toutes éditions)
  enriched.forEach(c => {
    const qty = countsByCard.get(c.id) || 0
    const key = canonicalName(c)
    countsByName.set(key, (countsByName.get(key) || 0) + qty)
  })

  const issues: LegalityIssue[] = []

  // Parcours par carte enrichie pour lever des problèmes "par carte"
  enriched.forEach(c => {
    const qty = countsByCard.get(c.id) || 0
    if (qty === 0) return

    const leg = c.legalities?.[format] || 'not_legal'
    const perCardIssues: string[] = []

    // (A) Légalité de format brute
    if (leg === 'not_legal' || leg === 'banned') {
      perCardIssues.push(`Illégale en ${format}`)
    }

    // (B) Singleton : >1 exemplaire sur CETTE impression (hors basic land)
    if (SINGLETON_FORMATS.has(format as MTGFormat) && qty > 1 && !isBasicLand(c)) {
      perCardIssues.push('Singleton: 1 exemplaire max sur cette carte')
    }

    // (C) Limite globale par NOM (4 par défaut, exceptions "relentless", Vintage restricted)
    const nameQty = countsByName.get(canonicalName(c)) || 0
    const allowed = getAllowedCopies(c, format, leg)
    if (Number.isFinite(allowed) && nameQty > allowed) {
      perCardIssues.push(
        allowed === 1
          ? 'Limite: 1 exemplaire max (toutes éditions confondues)'
          : `Limite: ${allowed} exemplaires max (toutes éditions confondues)`
      )
    }

    if (perCardIssues.length) {
      issues.push({
        scryfallId: c.id,
        name: c.name,
        qty,
        problems: perCardIssues,
      })
    }
  })

  // (D) Rareté (Pauper / Pauper Commander)
  const rarityIssues = checkRarityRules({
    format,
    enriched,
    countsByCard,
    commanderScryfallId: opts.commanderScryfallId ?? null,
  })
  rarityIssues.forEach(i => issues.push(i))

  // Résumé
  const sizeOk = total >= minRequired
  return {
    format,
    total,
    minRequired,
    sizeOk,
    isSingleton: SINGLETON_FORMATS.has(format as MTGFormat),
    issues, // [{ scryfallId, name, qty, problems:[] }]
  }
}
