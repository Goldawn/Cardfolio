// Détection heuristique du format d'un contenu utilisateur.
// Formats supportés : JSON | CSV | MTG Arena (texte)

export type DetectedFormat = "json" | "csv" | "arena"

/** Lecture simple d'un File côté navigateur */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onabort = () => reject(new Error("Lecture interrompue"))
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.readAsText(file)
  })
}

export function detectFormatFromText(text: string, filename?: string): DetectedFormat | null {
  const trimmed = (text ?? "").trim()
  const ext = (filename?.split(".").pop() || "").toLowerCase()

  // 1) Indice par extension
  if (ext === "json") return "json"
  if (ext === "csv") return "csv"
  if (ext === "txt") {
    // pas tranchant, on continue
  }

  // 2) Détections directes
  if (isJSONLike(trimmed)) return "json"
  if (isArenaLike(trimmed)) return "arena"
  if (isCSVLike(trimmed)) return "csv"

  // 3) Fallback : indice par structure de lignes
  if (looksLikeArenaByLines(trimmed)) return "arena"

  return null
}

export async function detectFromFile(file: File): Promise<{ format: DetectedFormat | null, text: string }> {
  const text = await readFileAsText(file)
  const format = detectFormatFromText(text, file.name)
  return { format, text }
}

// ----------------- Helpers -----------------

const NEWLINES_RE = /\r?\n/

function firstNonEmptyLines(text: string, max = 10): string[] {
  return text.split(NEWLINES_RE).map((l) => l.trim()).filter(Boolean).slice(0, max)
}

export function isJSONLike(text: string): boolean {
  if (!text) return false
  const t = text.trim()
  if (!((t.startsWith("[") && t.endsWith("]")) || (t.startsWith("{") && t.endsWith("}")))) return false
  try {
    JSON.parse(t)
    return true
  } catch {
    return false
  }
}

export function isCSVLike(text: string): boolean {
  if (!text) return false
  const lines = firstNonEmptyLines(text, 3)
  if (lines.length === 0) return false
  const sep = detectSeparator(lines[0])
  if (!sep) return false
  // au moins 2 colonnes en en-tête
  const headerCols = splitCSVLine(lines[0], sep)
  if (headerCols.length < 2) return false
  // la seconde ligne (si dispo) a le même nombre de colonnes ou plus
  if (lines[1]) {
    const cols2 = splitCSVLine(lines[1], sep)
    if (cols2.length < 1) return false
  }
  return true
}

export function isArenaLike(text: string): boolean {
  if (!text) return false
  // Sections Deck/Sideboard ou lignes "N Nom (SET) #" ou "N Nom"
  if (/^\s*deck\s*$/im.test(text)) return true
  if (/^\s*sideboard\s*$/im.test(text)) return true
  if (/^\s*companion\s*$/im.test(text)) return true
  if (/^\s*\d+\s+\S+/.test(text)) return true
  // exemples communs: "4 Lightning Bolt" ou "3 Opt" etc.
  const lines = firstNonEmptyLines(text, 5)
  return lines.some((l) => /^\d+\s+.+/.test(l))
}

function looksLikeArenaByLines(text: string): boolean {
  const lines = firstNonEmptyLines(text, 5)
  if (lines.some((l) => /^deck$/i.test(l))) return true
  if (lines.some((l) => /^sideboard$/i.test(l))) return true
  return lines.some((l) => /^\d+\s+.+/.test(l))
}

// --- CSV utils minimalistes (suffisant pour détecter) ---

function detectSeparator(header: string): "," | ";" | null {
  if (!header) return null
  // priorité à la virgule, sinon point-virgule (excel FR)
  if (header.includes(",")) return ","
  if (header.includes(";")) return ";"
  return null
}

function splitCSVLine(line: string, sep: "," | ";"): string[] {
  // Parse simple avec gestion des quotes doubles
  const out: string[] = []
  let cur = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { // escape ""
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (ch === sep && !inQuotes) {
      out.push(cur)
      cur = ""
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

// ----------------- Tests rapides (commentés) -----------------
/*
// JSON
console.assert(detectFormatFromText('[{"a":1}]') === 'json')
// CSV
console.assert(detectFormatFromText('a,b\n1,2') === 'csv')
console.assert(detectFormatFromText('a;b\n1;2') === 'csv')
// Arena
console.assert(detectFormatFromText('Deck\n4 Opt\nSideboard\n2 Abrade') === 'arena')
console.assert(detectFormatFromText('4 Lightning Bolt\n3 Opt') === 'arena')
*/
