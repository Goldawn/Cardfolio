// components/export/ExportModal.tsx
// Modale d'export avec prévisualisation et options de format

import React, { useEffect, useMemo, useState } from "react"
import SimpleModal, { ModalFooter } from "./SimpleModal"
import styles from "./ExportModal.module.css"
import {
  type ExportFormat,
  type CollectionRow,
  type DeckShape,
  type CsvOptions,
  type ArenaOptions,
  formatExportJSON,
  formatExportCSV,
  formatExportArena,
  deckToRows,
  DECK_CSV_COLUMNS,
  toBlob,
  download,
} from "../services/Import_Export/Formatters"

export type ExportKind = "collection" | "deck"

export type ExportModalProps = {
  open: boolean
  onClose: () => void

  kind: ExportKind
  data: CollectionRow[] | DeckShape

  /** Format par défaut */
  defaultFormat?: ExportFormat

  /** Base du nom de fichier (sans extension) */
  filenameBase?: string

  /** Options initiales CSV/Arena */
  csvOptions?: Partial<CsvOptions>
  arenaOptions?: Partial<ArenaOptions>

  /** Callback après export */
  onExported?: (filename: string) => void
}

export default function ExportModal(props: ExportModalProps) {
  const { open, onClose, kind, data, filenameBase, defaultFormat, csvOptions, arenaOptions, onExported } = props

  // Formats disponibles
  const availableFormats: ExportFormat[] = useMemo(() => {
    return kind === "collection" ? ["json", "csv"] : ["arena", "csv", "json"]
  }, [kind])

  const initialFormat = useMemo<ExportFormat>(() => {
    return availableFormats.includes(defaultFormat as ExportFormat)
      ? (defaultFormat as ExportFormat)
      : availableFormats[0]
  }, [availableFormats, defaultFormat])

  const [format, setFormat] = useState<ExportFormat>(initialFormat)
  useEffect(() => { setFormat(initialFormat) }, [initialFormat])

  const [csvSep, setCsvSep] = useState<"," | ";">((csvOptions?.separator as any) ?? ",")
  const [includeSet, setIncludeSet] = useState<boolean>(!!arenaOptions?.includeSet)

  const defaultBase = kind === "collection" ? "collection" : "deck"
  const [base, setBase] = useState<string>(filenameBase || defaultBase)
  useEffect(() => { setBase(filenameBase || defaultBase) }, [filenameBase, defaultBase])

  const [preview, setPreview] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ext = useMemo(() => (format === "json" ? ".json" : format === "csv" ? ".csv" : ".txt"), [format])
  const mime = useMemo(() => (
    format === "json" ? "application/json;charset=utf-8" :
    format === "csv" ? "text/csv;charset=utf-8" :
    "text/plain;charset=utf-8"
  ), [format])

  // Génération de la preview
  useEffect(() => {
    let cancelled = false
    async function run() {
      setBusy(true)
      setError(null)
      try {
        let txt = ""
        if (kind === "collection") {
          const rows = data as CollectionRow[]
          if (format === "json") {
            txt = formatExportJSON(rows, { indent: 2 })
          } else {
            const cols = ["scryfallId", "quantity", "dateAdded"]
            txt = formatExportCSV(rows as any[], { columns: cols, separator: csvSep, header: true, bom: true })
          }
        } else {
          // kind === "deck"
          const deck = data as DeckShape
          if (format === "arena") {
            txt = await formatExportArena(deck, { ...(arenaOptions ?? {}), includeSet })
          } else if (format === "csv") {
            const rows = deckToRows(deck)
            txt = formatExportCSV(rows as any[], { columns: DECK_CSV_COLUMNS, separator: csvSep, header: true, bom: true })
          } else {
            // json
            const rows = deckToRows(deck)
            txt = formatExportJSON(rows, { indent: 2 })
          }
        }
        if (!cancelled) setPreview(txt)
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Erreur lors de la génération de l’aperçu.")
          setPreview("")
        }
      } finally {
        if (!cancelled) setBusy(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [kind, data, format, csvSep, includeSet, arenaOptions])

  const onCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(preview)
      } else {
        const ta = document.createElement("textarea")
        ta.value = preview
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        ta.remove()
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  const doExport = async () => {
    const name = `${base || defaultBase}${ext}`
    const blob = toBlob(preview, mime)
    download(name, blob)
    onExported?.(name)
    onClose()
  }

  return (
    <SimpleModal
      open={open}
      onClose={onClose}
      title={kind === "collection" ? "Exporter la collection" : "Exporter le deck"}
      size="lg"
      closeOnBackdrop
    >
      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Format</label>
            <div className={styles.segmented}>
              {availableFormats.map((f) => (
                <button
                  key={f}
                  className={f === format ? `${styles.segment} ${styles.segmentActive}` : styles.segment}
                  onClick={() => setFormat(f)}
                  type="button"
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Séparateur CSV: s'affiche si format === csv, quelle que soit la nature (deck/collection) */}
          {format === "csv" && (
            <div className={styles.field}>
              <label className={styles.label}>Séparateur CSV</label>
              <div className={styles.segmented}>
                <button
                  className={csvSep === "," ? `${styles.segment} ${styles.segmentActive}` : styles.segment}
                  onClick={() => setCsvSep(",")}
                  type="button"
                >
                  , (virgule)
                </button>
                <button
                  className={csvSep === ";" ? `${styles.segment} ${styles.segmentActive}` : styles.segment}
                  onClick={() => setCsvSep(";")}
                  type="button"
                >
                  ; (point-virgule)
                </button>
              </div>
            </div>
          )}

          {/* Options Arena: s'affiche uniquement pour deck + format arena */}
          {kind === "deck" && format === "arena" && (
            <div className={styles.field}>
              <label className={styles.label}>Options Arena</label>
              <label className={styles.checkLabel}>
                <input type="checkbox" checked={includeSet} onChange={(e) => setIncludeSet(e.target.checked)} />
                Inclure (SET) #num
              </label>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Nom du fichier</label>
            <div className={styles.filenameWrap}>
              <input className={styles.filename} value={base} onChange={(e) => setBase(e.target.value)} />
              <span className={styles.ext}>{ext}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className={styles.previewWrap}>
        <div className={styles.previewHeader}>
          <div className={styles.badge}>
            {busy ? "Préparation…" : error ? `Erreur: ${error}` : `Prévisualisation (${preview.split("\n").length} lignes)`}
          </div>
          <div className={styles.previewActions}>
            <button className={styles.btnSecondary} onClick={onCopy} disabled={!preview}>
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>
        </div>
        <pre className={styles.preview} aria-busy={busy}>{preview || ""}</pre>
      </div>

      <ModalFooter>
        <button className={styles.btnSecondary} onClick={onClose}>Annuler</button>
        <button className={styles.btnPrimary} onClick={doExport} disabled={!preview || busy || !!error}>Exporter</button>
      </ModalFooter>
    </SimpleModal>
  )
}
