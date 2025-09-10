// components/import/ImportFlow.tsx
// Lanceur d'import : input fichier -> détection & parsing -> modale de revue

import React, { useRef, useState } from "react"
import SimpleModal, { ModalFooter } from "./SimpleModal"
import ImportPreview from "./ImportPreview"
import { detectAndParseFile, ImportSummary } from "../services/Import_Export/ImportFacade"
import type { ImportMode } from "../services/Import_Export/Parsers"
import styles from "./ImportFlow.module.css"

export type ImportDestination = "collection" | "deck" | "wishlist"

export type ImportFlowProps = {
  /** Callback final: l'app applique l'import (API). */
  onApply: (params: {
    destinations: ImportDestination[]
    mode: ImportMode
    summary: ImportSummary
    file: File
  }) => Promise<void> | void
  /** Destinations cochées par défaut (multi) — ex: ["collection"] */
  defaultDestinations?: ImportDestination[]
}

function hasAnyDestination(d: Record<ImportDestination, boolean>): boolean {
  return !!(d.collection || d.deck || d.wishlist)
}

export default function ImportFlow({
  onApply,
  defaultDestinations = ["collection"],
}: ImportFlowProps) {
  const [open, setOpen] = useState(false)
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [destinations, setDestinations] = useState<Record<ImportDestination, boolean>>({
    collection: defaultDestinations.includes("collection"),
    deck: defaultDestinations.includes("deck"),
    wishlist: defaultDestinations.includes("wishlist"),
  })
  const [mode, setMode] = useState<ImportMode>("merge")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const onFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setError(null)
    const res = await detectAndParseFile(f)
    if (!res.format || !res.summary) {
      setError("Format non reconnu. Utilisez JSON, CSV ou texte MTG Arena.")
      setOpen(false)
    } else {
      setFile(f)
      setSummary(res.summary)
      // Heuristique pratique : si Arena, on coche Deck (sans décocher le reste)
      if (res.format === "arena") {
        setDestinations((prev) => ({ ...prev, deck: true }))
      }
      setOpen(true)
    }
    if (inputRef.current) inputRef.current.value = ""
  }

  const onConfirm = async () => {
    if (!summary || !file) return
    const selected: ImportDestination[] = Object.entries(destinations)
      .filter(([, v]) => v)
      .map(([k]) => k as ImportDestination)
    if (selected.length === 0) return
    await onApply({ destinations: selected, mode, summary, file })
    setOpen(false)
  }

  const reset = () => {
    setSummary(null)
    setFile(null)
    setError(null)
    setOpen(false)
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>Importer un fichier</label>
      <input
        ref={inputRef}
        className={styles.input}
        type="file"
        accept=".json,.csv,.txt"
        onChange={onFile}
      />
      {error && <div className={styles.error}>{error}</div>}

      <SimpleModal
        open={open}
        onClose={reset}
        title="Vérifier l'import"
        size="lg"
        closeOnBackdrop={true}
      >
        <div className={styles.controls}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Destinations (plusieurs possibles)</legend>
            {/* On réutilise la grille .radios/.radioLabel pour le style, même si ce sont des checkboxes */}
            <div className={styles.radios}>
              <label className={styles.radioLabel}>
                <input
                  type="checkbox"
                  checked={destinations.collection}
                  onChange={(e) =>
                    setDestinations((d) => ({ ...d, collection: e.target.checked }))
                  }
                />
                <span>Collection</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="checkbox"
                  checked={destinations.deck}
                  onChange={(e) =>
                    setDestinations((d) => ({ ...d, deck: e.target.checked }))
                  }
                />
                <span>Deck</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="checkbox"
                  checked={destinations.wishlist}
                  onChange={(e) =>
                    setDestinations((d) => ({ ...d, wishlist: e.target.checked }))
                  }
                />
                <span>Wishlist</span>
              </label>
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Mode</legend>
            <div className={styles.radios}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="mode"
                  value="merge"
                  checked={mode === "merge"}
                  onChange={() => setMode("merge")}
                />
                <span>Fusion</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="mode"
                  value="replace"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                />
                <span>Remplacer</span>
              </label>
            </div>
          </fieldset>
        </div>

        {summary && (
          <div className={styles.preview}>
            <ImportPreview summary={summary} />
          </div>
        )}

        <ModalFooter>
          <button className={styles.btnSecondary} onClick={reset}>Annuler</button>
          <button
            className={styles.btnPrimary}
            onClick={onConfirm}
            disabled={!summary || !hasAnyDestination(destinations)}
          >
            Valider et appliquer
          </button>
        </ModalFooter>
      </SimpleModal>
    </div>
  )
}
