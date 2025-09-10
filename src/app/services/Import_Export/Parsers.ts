// Parsers d'import sans dépendances externes.
// - Collection JSON
// - Collection CSV (séparateur virgule ou point-virgule)
// - Deck MTG Arena (texte)
//
// Les sorties sont des "résumés" prêts à afficher dans la modale de revue.

export type ImportMode = "merge" | "replace"

// ---------- Types Collection ----------
export type CollectionItemInput = { scryfallId: string; quantity: number }
export type ImportSummaryCollection = {
  kind: "collection"
  items: CollectionItemInput[] // dédupliquées & agrégées
  totalLines: number
  errors: string[]
  warnings: string[]
}

// ---------- Types Deck Arena ----------
export type ArenaZone = "main" | "sideboard" | "companion"
export type ArenaEntryRaw = {
  zone: ArenaZone
  quantity: number
  name: string
  set?: string
  collectorNumber?: string
}
export type ImportSummaryArena = {
  kind: "arena"
  entries: ArenaEntryRaw[]
  totalLines: number
  errors: string[]
  warnings: string[]
}

// =============================================================
// Utils génériques
// =============================================================

const NEWLINES_RE = /\r?\n/

function isUUIDLike(str: string): boolean {
  return /^[0-9a-fA-F-]{36}$/.test(str)
}

function toIntStrict(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === "number" ? v : parseInt(String(v), 10)
  if (!Number.isFinite(n)) return null
  if (!Number.isInteger(n)) return null
  return n
}

function dedupeAndSum(items: CollectionItemInput[]): CollectionItemInput[] {
  const map = new Map<string, number>()
  for (const it of items) {
    map.set(it.scryfallId, (map.get(it.scryfallId) ?? 0) + it.quantity)
  }
  return Array.from(map, ([scryfallId, quantity]) => ({ scryfallId, quantity }))
}

// =============================================================
// 1) Collection JSON
// =============================================================

export function parseCollectionJSON(text: string): ImportSummaryCollection {
  const errors: string[] = []
  const warnings: string[] = []
  let rows: any[] = []

  try {
    const parsed = JSON.parse(text)
    rows = Array.isArray(parsed) ? parsed : [parsed]
  } catch (e: any) {
    errors.push(`JSON invalide: ${e?.message ?? "?"}`)
    return { kind: "collection", items: [], totalLines: 0, errors, warnings }
  }

  const tmp: CollectionItemInput[] = []
  rows.forEach((r, idx) => {
    const id = String(r?.scryfallId ?? "").trim().toLowerCase()
    const qty = toIntStrict(r?.quantity ?? 1)

    if (!id || !isUUIDLike(id)) {
      errors.push(`Ligne ${idx + 1}: scryfallId invalide "${r?.scryfallId ?? ""}"`)
      return
    }
    if (qty === null || qty < 0) {
      errors.push(`Ligne ${idx + 1} (${id}): quantité invalide "${r?.quantity ?? ""}"`)
      return
    }
    tmp.push({ scryfallId: id, quantity: qty })
  })

  const items = dedupeAndSum(tmp)
  return { kind: "collection", items, totalLines: rows.length, errors, warnings }
}

// =============================================================
// 2) Collection CSV
// =============================================================

export type ParseCollectionCsvOptions = {
  separator?: "," | ";" // auto si non fourni
  columns?: { scryfallId?: string; quantity?: string } // mapping d'en-têtes (par défaut "scryfallId" & "quantity")
}

export function parseCollectionCSV(text: string, opts: ParseCollectionCsvOptions = {}): ImportSummaryCollection {
  const errors: string[] = []
  const warnings: string[] = []
  const lines = (text ?? "").split(NEWLINES_RE)

  if (!lines.length) {
    return { kind: "collection", items: [], totalLines: 0, errors: ["Fichier CSV vide"], warnings }
  }

  const headerLine = (lines.find((l) => l.trim().length > 0) ?? "").trim()
  const sep = opts.separator ?? detectSeparator(headerLine) ?? ","
  const header = splitCSVLine(headerLine, sep).map((h) => h.trim())

  const nameId = (opts.columns?.scryfallId ?? "scryfallId").toLowerCase()
  const nameQty = (opts.columns?.quantity ?? "quantity").toLowerCase()

  const idxId = header.findIndex((h) => h.toLowerCase() === nameId)
  const idxQty = header.findIndex((h) => h.toLowerCase() === nameQty)

  if (idxId === -1) {
    errors.push(`Colonne obligatoire manquante: "${nameId}"`)
    return { kind: "collection", items: [], totalLines: 0, errors, warnings }
  }

  const dataLines = lines.slice(lines.indexOf(headerLine) + 1)
  const tmp: CollectionItemInput[] = []

  dataLines.forEach((raw, i) => {
    const lineNo = i + 2 // +1 header, +1 base 1
    if (!raw.trim()) return
    const cols = splitCSVLine(raw, sep)

    const id = String(cols[idxId] ?? "").trim().toLowerCase()
    const qtyRaw = idxQty !== -1 ? cols[idxQty] : "1"
    const qty = toIntStrict(qtyRaw ?? 1)

    if (!id || !isUUIDLike(id)) {
      errors.push(`Ligne ${lineNo}: scryfallId invalide "${id}"`)
      return
    }
    if (qty === null || qty < 0) {
      errors.push(`Ligne ${lineNo} (${id}): quantité invalide "${qtyRaw ?? ""}"`)
      return
    }
    tmp.push({ scryfallId: id, quantity: qty })
  })

  const items = dedupeAndSum(tmp)
  return { kind: "collection", items, totalLines: dataLines.length, errors, warnings }
}

// --- CSV helpers ---
function detectSeparator(header: string): "," | ";" | null {
  if (!header) return null
  if (header.includes(",")) return ","
  if (header.includes(";")) return ";"
  return null
}

function splitCSVLine(line: string, sep: "," | ";"): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; continue }
      inQuotes = !inQuotes; continue
    }
    if (ch === sep && !inQuotes) { out.push(cur); cur = ""; continue }
    cur += ch
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

// =============================================================
// 3) Deck MTG Arena (texte)
// =============================================================

export function parseArenaText(text: string): ImportSummaryArena {
  const lines = (text ?? "").split(NEWLINES_RE)
  const entries: ArenaEntryRaw[] = []
  const errors: string[] = []
  const warnings: string[] = []
  let zone: ArenaZone = "main"

  const LINE_RE = /^(\d+)\s+(.+?)(?:\s+\(([A-Za-z0-9]{2,5})\)\s+(\d+[A-Za-z]?))?\s*$/

  lines.forEach((raw, i) => {
    const line = raw.trim()
    if (!line || line.startsWith("//")) return

    if (/^deck$/i.test(line)) { zone = "main"; return }
    if (/^sideboard$/i.test(line)) { zone = "sideboard"; return }
    if (/^companion$/i.test(line)) { zone = "companion"; return }

    const m = line.match(LINE_RE)
    if (!m) { warnings.push(`Ligne ${i + 1} ignorée: "${raw}"`); return }

    const qty = toIntStrict(m[1])
    const name = (m[2] ?? "").trim()
    const set = (m[3] ?? "").toUpperCase() || undefined
    const collectorNumber = (m[4] ?? "") || undefined

    if (qty === null || qty <= 0 || !name) { errors.push(`Ligne ${i + 1} invalide: "${raw}"`); return }

    entries.push({ zone, quantity: qty, name, set, collectorNumber })
  })

  return { kind: "arena", entries, totalLines: lines.length, errors, warnings }
}

// =============================================================
// Notes
// - Ces parsers restent tolérants et renvoient un résumé structuré + erreurs.
// - La résolution nom -> scryfallId se fait en aval (service dédié), pas ici.
// - Pour la collection CSV, on peut étendre `columns` si besoin (alias d'en-têtes).
