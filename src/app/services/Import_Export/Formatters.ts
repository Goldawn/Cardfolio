// Utilitaires d'export (sans dépendances externes)
// - JSON : string formaté
// - CSV  : string avec échappement robuste (séparateur , ou ;)
// - Arena: texte MTG Arena (async si nameResolver)
// + Helpers: toBlob(), download()

export type ExportFormat = "json" | "csv" | "arena"

// ---------------- Types de données ----------------

export type CollectionRow = {
  scryfallId: string
  quantity: number
  dateAdded?: string | Date
}

export type ArenaZone = "main" | "sideboard" | "companion"

export type DeckEntry = {
  zone?: ArenaZone
  quantity: number
  // Pour Arena, au moins "name" OU bien "scryfallId" + nameResolver
  name?: string
  scryfallId?: string
  // Optionnel si on veut inclure l'impression (SET) #
  set?: string
  collectorNumber?: string | number
}

export type DeckShape =
  | { main: DeckEntry[]; sideboard?: DeckEntry[]; companion?: DeckEntry[] }
  | DeckEntry[]

// ---------------- JSON ----------------

export type JsonOptions = {
  /** Indentation (par défaut 2) ; 0 pour minifier */
  indent?: number
}

export function formatExportJSON<T = unknown>(rows: T[], opts: JsonOptions = {}): string {
  const indent = Number.isInteger(opts.indent) ? (opts.indent as number) : 2
  return JSON.stringify(rows, null, Math.max(0, indent))
}

// ---------------- CSV ----------------

export type CsvOptions = {
  /** Colonnes explicites ; inférées si absent */
  columns?: string[]
  /** Séparateur ("," par défaut ; ";" courant sur Excel FR) */
  separator?: "," | ";"
  /** Inclure l'en-tête ? (true par défaut) */
  header?: boolean
  /** Préfixer d'une BOM UTF-8 (utile pour Excel) ; true par défaut */
  bom?: boolean
}

export function formatExportCSV(rows: Record<string, unknown>[], opts: CsvOptions = {}): string {
  const sep = opts.separator ?? ","
  const bom = opts.bom ?? true
  const withHeader = opts.header ?? true
  const cols = (opts.columns && opts.columns.length > 0) ? opts.columns : inferColumns(rows)

  const lines: string[] = []
  if (withHeader) lines.push(cols.map((c) => csvEscape(c, sep)).join(sep))

  for (const r of rows) {
    const vals = cols.map((c) => csvEscape(valueToCell((r as any)[c]), sep))
    lines.push(vals.join(sep))
  }

  const body = lines.join("\r\n")
  return bom ? "\uFEFF" + body : body
}

function inferColumns(rows: Record<string, unknown>[]): string[] {
  const set = new Set<string>()
  for (const r of rows) Object.keys(r ?? {}).forEach((k) => set.add(k))
  return [...set]
}

function valueToCell(v: unknown): string {
  if (v === null || v === undefined) return ""
  if (v instanceof Date) return v.toISOString()
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

function csvEscape(raw: string, sep: "," | ";"): string {
  const s = raw ?? ""
  const needsQuote = s.includes("\n") || s.includes("\r") || s.includes("\"") || s.includes(sep)
  if (!needsQuote) return s
  return '"' + s.replaceAll('"', '""') + '"'
}

// ---------------- Arena ----------------

export type ArenaOptions = {
  /** Inclure (SET) #num si set+collectorNumber présents */
  includeSet?: boolean
  /** Résolution du nom à partir du scryfallId si `name` manquant */
  nameResolver?: (scryfallId: string) => Promise<string> | string
}

export async function formatExportArena(deck: DeckShape, opts: ArenaOptions = {}): Promise<string> {
  const lines: string[] = []
  lines.push("Deck")

  const writeZone = async (zone: ArenaZone, items: DeckEntry[] | undefined) => {
    if (!items || items.length === 0) return
    if (zone === "sideboard") lines.push("Sideboard")
    if (zone === "companion") lines.push("Companion")
    for (const it of items) {
      const qty = Number(it.quantity ?? 1)
      const name = await getCardName(it, opts)
      const set = it.set?.toUpperCase()
      const num = it.collectorNumber
      const withPrint = !!(opts.includeSet && set && (num || num === 0))
      lines.push(withPrint ? `${qty} ${name} (${set}) ${num}` : `${qty} ${name}`)
    }
  }

  if (Array.isArray(deck)) {
    const main = deck.filter((e) => (e.zone ?? "main") === "main")
    const side = deck.filter((e) => e.zone === "sideboard")
    const comp = deck.filter((e) => e.zone === "companion")
    await writeZone("main", main)
    await writeZone("sideboard", side)
    await writeZone("companion", comp)
  } else {
    await writeZone("main", deck.main)
    await writeZone("sideboard", deck.sideboard)
    await writeZone("companion", deck.companion)
  }

  return lines.join("\n") + "\n"
}

async function getCardName(it: DeckEntry, opts: ArenaOptions): Promise<string> {
  if (it.name && it.name.trim()) return it.name
  if (it.scryfallId && opts.nameResolver) {
    const n = await opts.nameResolver(it.scryfallId)
    if (n && String(n).trim()) return String(n)
  }
  throw new Error("Export Arena: fournir `name` ou bien `scryfallId` + `nameResolver`." )
}

// ---------------- Helpers de téléchargement ----------------

export function toBlob(text: string, mime = "text/plain;charset=utf-8"): Blob {
  return new Blob([text], { type: mime })
}

/**
 * Déclenche un téléchargement sans dépendance externe.
 * Utiliser dans un handler (click) côté client.
 */
export function download(filename: string, blob: Blob) {
  if (typeof document === "undefined") return
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ---- Deck -> rows (pour CSV/JSON) ----
export type ExportDeckRow = {
  zone: "main" | "sideboard" | "companion"
  quantity: number
  name?: string
  scryfallId?: string
  set?: string
  collectorNumber?: string | number
}

/** Aplati un DeckShape en lignes pour CSV/JSON */
export function deckToRows(deck: DeckShape): ExportDeckRow[] {
  const rows: ExportDeckRow[] = []
  const pushAll = (zone: "main" | "sideboard" | "companion", items?: DeckEntry[]) => {
    if (!items) return
    for (const it of items) {
      rows.push({
        zone,
        quantity: Number(it.quantity ?? 1),
        name: it.name,
        scryfallId: it.scryfallId,
        set: it.set?.toString().toUpperCase(),
        collectorNumber: it.collectorNumber,
      })
    }
  }

  if (Array.isArray(deck)) {
    for (const e of deck) {
      rows.push({
        zone: (e.zone ?? "main") as any,
        quantity: Number(e.quantity ?? 1),
        name: e.name,
        scryfallId: e.scryfallId,
        set: e.set?.toString().toUpperCase(),
        collectorNumber: e.collectorNumber,
      })
    }
  } else {
    pushAll("main", deck.main)
    pushAll("sideboard", deck.sideboard)
    pushAll("companion", deck.companion)
  }
  return rows
}

/** Colonnes recommandées pour CSV deck */
export const DECK_CSV_COLUMNS = ["zone", "quantity", "name", "scryfallId", "set", "collectorNumber"]

// ---------------- Sugars pratiques ----------------

export function exportCollectionAsJSON(rows: CollectionRow[], filename = "collection.json") {
  const text = formatExportJSON(rows)
  download(filename, toBlob(text, "application/json;charset=utf-8"))
}

export function exportCollectionAsCSV(
  rows: CollectionRow[],
  filename = "collection.csv",
  opts: CsvOptions = { columns: ["scryfallId", "quantity", "dateAdded"], separator: ",", header: true, bom: true },
) {
  const text = formatExportCSV(rows as any[], opts)
  download(filename, toBlob(text, "text/csv;charset=utf-8"))
}

export async function exportDeckAsArena(
  deck: DeckShape,
  filename = "deck.txt",
  opts: ArenaOptions = {}
) {
  const text = await formatExportArena(deck, opts)
  download(filename, toBlob(text, "text/plain;charset=utf-8"))
}

/**
 * Exemples d'usage
 *
 * // Collection JSON
 * const items: CollectionRow[] = [
 *   { scryfallId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", quantity: 3 },
 * ]
 * exportCollectionAsJSON(items)
 *
 * // Collection CSV (séparateur point-virgule)
 * exportCollectionAsCSV(items, "collection.csv", { separator: ";" })
 *
 * // Deck Arena
 * const deck = {
 *   main: [ { quantity: 4, name: "Lightning Bolt" } ],
 *   sideboard: [ { quantity: 2, name: "Abrade", set: "XLN", collectorNumber: 138 } ],
 * }
 * await exportDeckAsArena(deck, "mon-deck.txt", { includeSet: true })
 */