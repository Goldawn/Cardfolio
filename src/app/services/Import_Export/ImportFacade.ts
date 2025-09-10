// Regroupe la détection + parsing pour l'import (sans dépendance externe)

import { detectFormatFromText, readFileAsText, type DetectedFormat } from "./FormatDetection"
import {
  parseCollectionCSV,
  parseCollectionJSON,
  parseArenaText,
  type ImportSummaryCollection,
  type ImportSummaryArena,
} from "./Parsers"

export type ImportSummary = ImportSummaryCollection | ImportSummaryArena

export async function detectAndParseFile(file: File): Promise<{
  format: DetectedFormat | null
  summary: ImportSummary | null
  text: string
}> {
  const text = await readFileAsText(file)
  const format = detectFormatFromText(text, file.name)
  if (!format) return { format: null, summary: null, text }

  if (format === "json") {
    return { format, summary: parseCollectionJSON(text), text }
  }
  if (format === "csv") {
    return { format, summary: parseCollectionCSV(text), text }
  }
  // arena
  return { format, summary: parseArenaText(text), text }
}
