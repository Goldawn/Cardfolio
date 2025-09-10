// services/importApi.ts
// Facade d'application pour brancher le flux d'import côté UI.
// - En prod: utilise des endpoints REST (à adapter)
// - En dev: mode MOCK qui simule les réponses pour tester le workflow

import type { ImportMode, ImportSummaryArena, ArenaEntryRaw } from "./Parsers"
import type { ImportSummary } from "./ImportFacade"
import type { ImportDestination } from "../../components/ImportFlow"

// ---------------------------------------------------------------
// Config
// ---------------------------------------------------------------

const MOCK = true // passe à false pour tester contre de vrais endpoints
const API_BASE = "/api" // préfixe des routes backend

// ---------------------------------------------------------------
// Types utiles
// ---------------------------------------------------------------

export type ApplyImportParams = {
  destinations: ImportDestination[]      // <-- multi-destinations
  mode: ImportMode
  summary: ImportSummary
  file?: File
}

export type ApplyImportResult = {
  ok: true
  message?: string
  details?: any
} | {
  ok: false
  error: string
  details?: any
}

export type ResolvedDeck = {
  main: { scryfallId: string; quantity: number }[]
  sideboard: { scryfallId: string; quantity: number }[]
  companion?: { scryfallId: string; quantity: number }[]
  unresolved: { quantity: number; name: string; set?: string; collectorNumber?: string }[]
}

// ---------------------------------------------------------------
// Entrée principale appelée par ImportFlow.onApply
// ---------------------------------------------------------------

export async function applyImport(params: ApplyImportParams): Promise<ApplyImportResult> {
  const { destinations, mode, summary } = params

  try {
    const results: Record<ImportDestination, any> = {
      collection: null,
      deck: null,
      wishlist: null,
    }

    // ---- Collection ----
    if (destinations.includes("collection")) {
      if (summary.kind === "collection") {
        results.collection = await applyCollectionOrWishlist("collection", { mode, items: summary.items })
      } else {
        // Arena -> collection : on résout puis on agrège toutes les zones
        const resolved = await resolveArenaEntries(summary)
        const items = resolvedDeckToCollection(resolved)
        results.collection = await applyCollectionOrWishlist("collection", { mode, items })
      }
    }

    // ---- Wishlist ----
    if (destinations.includes("wishlist")) {
      if (summary.kind === "collection") {
        results.wishlist = await applyCollectionOrWishlist("wishlist", { mode, items: summary.items })
      } else {
        const resolved = await resolveArenaEntries(summary)
        const items = resolvedDeckToCollection(resolved)
        results.wishlist = await applyCollectionOrWishlist("wishlist", { mode, items })
      }
    }

    // ---- Deck ----
    if (destinations.includes("deck")) {
      if (summary.kind !== "arena") {
        results.deck = { ok: false, error: "Le fichier n'est pas un deck Arena." }
      } else {
        const resolved = await resolveArenaEntries(summary)
        if (MOCK) {
          await delay(300)
          results.deck = {
            ok: true,
            message: `Deck importé (${resolved.main.length + resolved.sideboard.length + (resolved.companion?.length ?? 0)} cartes)`,
            details: resolved,
          }
        } else {
          const res = await fetch(`${API_BASE}/decks/import`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mode, deck: resolved }),
          })
          results.deck = res.ok
            ? { ok: true, details: await res.json().catch(() => ({})) }
            : { ok: false, error: `HTTP ${res.status}` }
        }
      }
    }

    // Agréger le statut global
    const picked = Object.values(results).filter(Boolean)
    const allOk = picked.length > 0 && picked.every((r: any) => r.ok)
    const message = buildSummaryMessage(results)

    return allOk
      ? { ok: true, message, details: results }
      : { ok: false, error: message, details: results }

  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Erreur inconnue", details: e }
  }
}

// ---------------------------------------------------------------
// Collection/Wishlist helpers
// ---------------------------------------------------------------

async function applyCollectionOrWishlist(
  kind: "collection" | "wishlist",
  payload: { mode: ImportMode; items: { scryfallId: string; quantity: number }[] }
) {
  if (MOCK) {
    await delay(250)
    return { ok: true, message: `${payload.items.length} item(s) -> ${kind} (${payload.mode})` }
  }
  const url = kind === "collection" ? `${API_BASE}/collection/import` : `${API_BASE}/wishlist/import`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
  return { ok: true, details: await res.json().catch(() => ({})) }
}

// ---------------------------------------------------------------
// Résolution d'un deck Arena -> scryfallId/quantités par zone
// ---------------------------------------------------------------

async function resolveArenaEntries(summary: ImportSummaryArena): Promise<ResolvedDeck> {
  const main: ResolvedDeck["main"] = []
  const sideboard: ResolvedDeck["sideboard"] = []
  const companion: ResolvedDeck["companion"] = []
  const unresolved: ResolvedDeck["unresolved"] = []

  for (const e of summary.entries) {
    const id = await resolveOne(e)
    if (!id) {
      unresolved.push({ quantity: e.quantity, name: e.name, set: e.set, collectorNumber: e.collectorNumber })
      continue
    }
    const target = e.zone === "sideboard" ? sideboard : (e.zone === "companion" ? companion : main)
    target.push({ scryfallId: id, quantity: e.quantity })
  }

  const result: ResolvedDeck = {
    main: mergeById(main),
    sideboard: mergeById(sideboard),
    unresolved,
  }
  if (companion.length) result.companion = mergeById(companion)
  return result
}

// Convertit un deck résolu en liste agrégée pour Collection/Wishlist
function resolvedDeckToCollection(res: ResolvedDeck): { scryfallId: string; quantity: number }[] {
  const all = [
    ...res.main,
    ...res.sideboard,
    ...(res.companion ?? []),
  ]
  return mergeById(all)
}

function mergeById(list: { scryfallId: string; quantity: number }[]): { scryfallId: string; quantity: number }[] {
  const m = new Map<string, number>()
  for (const it of list) m.set(it.scryfallId, (m.get(it.scryfallId) ?? 0) + it.quantity)
  return Array.from(m, ([scryfallId, quantity]) => ({ scryfallId, quantity }))
}

async function resolveOne(e: ArenaEntryRaw): Promise<string | null> {
  if (MOCK) {
    // En mode MOCK, on génère un UUID déterministe à partir du nom + set + number
    return fakeUuid(`${e.name}|${e.set ?? ""}|${e.collectorNumber ?? ""}`)
  }
  // Prod: d'abord impression exacte si set + collectorNumber, sinon par nom
  if (e.set && e.collectorNumber) {
    const exact = await fetchJson<{ scryfallId: string }>(
      `${API_BASE}/cards/print?set=${encodeURIComponent(e.set)}&collectorNumber=${encodeURIComponent(e.collectorNumber)}`
    )
    if (exact?.scryfallId) return exact.scryfallId
  }
  const byName = await fetchJson<{ scryfallId: string }>(
    `${API_BASE}/cards/resolve?name=${encodeURIComponent(e.name)}`
  )
  return byName?.scryfallId ?? null
}

async function fetchJson<T = any>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function buildSummaryMessage(results: Record<ImportDestination, any>): string {
  const parts: string[] = []
  ;(["collection", "wishlist", "deck"] as ImportDestination[]).forEach((k) => {
    const r = results[k]
    if (!r) return
    parts.push(`${k}: ${r.ok ? (r.message ?? "OK") : `Erreur (${r.error ?? "?"})`}`)
  })
  return parts.join(" | ") || "Aucune destination"
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// Petit générateur de pseudo-UUID déterministe pour la démo
function fakeUuid(input: string): string {
  let h1 = 0x811c9dc5, h2 = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i)
    h1 ^= c; h1 = (h1 * 0x01000193) >>> 0
    h2 ^= (c << 16) ^ c; h2 = (h2 * 0x01000193) >>> 0
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0")
  const a = hex(h1).slice(0, 8)
  const b = hex(h2).slice(0, 4)
  const c = hex(h1 ^ h2).slice(0, 4)
  const d = hex(h2 ^ 0xdeadbeef).slice(0, 4)
  const e = (hex(h1) + hex(h2)).slice(0, 12)
  return `${a}-${b}-${c}-${d}-${e}`
}
