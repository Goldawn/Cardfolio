// components/import/ImportFlow.tsx
// Lanceur d'import : textarea (coller), drag&drop/clic (fichier) -> détection & parsing -> modale de revue

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
    deckName?: string
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
  const [deckName, setDeckName] = useState<string>("")

  const [destinations, setDestinations] = useState<Record<ImportDestination, boolean>>({
    collection: defaultDestinations.includes("collection"),
    deck: defaultDestinations.includes("deck"),
    wishlist: defaultDestinations.includes("wishlist"),
  })
  const [mode, setMode] = useState<ImportMode>("merge")
  const [error, setError] = useState<string | null>(null)

  const [pastedText, setPastedText] = useState<string>("")
  const [dragActive, setDragActive] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)

  // --- logique commune d’analyse ---
  const handleParsed = (res: { format: string | null; summary: ImportSummary | null }, sourceFile?: File) => {
    if (!res.format || !res.summary) {
      setError("Format non reconnu. Utilisez JSON, CSV ou texte MTG Arena.")
      setOpen(false)
      return
    }
    setSummary(res.summary)
    // UX: si Arena, on coche Deck automatiquement (sans décocher le reste)
    if (res.format === "arena") {
      setDestinations((prev) => ({ ...prev, deck: true }))
      const baseFromFile =
        sourceFile && sourceFile.name && sourceFile.name !== "pasted.txt"
          ? sourceFile.name.replace(/\.[^.]+$/, "")
          : "Deck importé"
      setDeckName((prev) => prev || baseFromFile)
    }
    setOpen(true)
  }

  const analyzeFile = async (f: File) => {
    setError(null)
    const res = await detectAndParseFile(f)
    setFile(f)
    handleParsed(res, f)
  }

  const analyzePastedText = async () => {
    const text = pastedText.trim()
    if (!text) return
    // On réutilise la même pipeline que pour un fichier
    const f = new File([text], "pasted.txt", { type: "text/plain" })
    await analyzeFile(f)
  }

  // --- handlers input fichier & DnD ---
  const onFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    await analyzeFile(f)
    if (inputRef.current) inputRef.current.value = ""
  }

  const onDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const f = e.dataTransfer?.files?.[0]
    if (f) await analyzeFile(f)
  }

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    // ne désactive que si on quitte réellement la zone
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setDragActive(false)
  }

  const triggerFileDialog = () => inputRef.current?.click()

  // --- validation modale ---
  const onConfirm = async () => {
    if (!summary || !file) return
    const selected: ImportDestination[] = Object.entries(destinations)
      .filter(([, v]) => v)
      .map(([k]) => k as ImportDestination)
    if (selected.length === 0) return
    await onApply({
      destinations: selected,
      mode,
      summary,
      file,
      deckName: destinations.deck ? deckName.trim() : undefined,
    })
    setOpen(false)
  }

  const reset = () => {
    setSummary(null)
    setFile(null)
    setDeckName("") // important pour éviter un ancien nom persistant
    setError(null)
    setOpen(false)
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>Ajouter des données</label>

      {/* Bloc d’ajout : textarea + dropzone */}
      <div className={styles.addBlock}>
        {/* Zone de texte (coller un deck Arena, etc.) */}
        <div className={styles.textCol}>
          <label className={styles.subLabel}>Coller un contenu (JSON / CSV / MTG Arena)</label>
          <textarea
            className={styles.textarea}
            rows={8}
            placeholder="Collez ici une decklist Arena, ou un JSON/CSV lisible..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={() => setPastedText("")}>Effacer</button>
            <button
              className={styles.btnPrimary}
              onClick={analyzePastedText}
              disabled={!pastedText.trim()}
              title={!pastedText.trim() ? "Collez d'abord du texte" : "Analyser ce texte"}
            >
              Analyser le texte
            </button>
          </div>
        </div>

        {/* Zone de drag & drop (et clic pour ouvrir le file picker) */}
        <div
          ref={dropRef}
          className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={triggerFileDialog}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && triggerFileDialog()}
          aria-label="Déposer un fichier ou cliquer pour sélectionner"
        >
          <div className={styles.dropInner}>
            <div className={styles.dropTitle}>Glissez un fichier ici</div>
            <div className={styles.dropHint}>ou cliquez pour sélectionner un fichier (.json, .csv, .txt)</div>
          </div>
        </div>

        {/* Input fichier masqué */}
        <input
          ref={inputRef}
          className={styles.input}
          type="file"
          accept=".json,.csv,.txt"
          onChange={onFile}
          style={{ display: "none" }}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Modale de revue */}
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

          {destinations.deck && (
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Deck</legend>
              <div className={styles.field}>
                <label className={styles.subLabel} htmlFor="deckName">Nom du deck</label>
                <input
                  id="deckName"
                  className={styles.textInput}
                  type="text"
                  placeholder="Nom du deck"
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                />
              </div>
            </fieldset>
          )}
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
            disabled={!summary || !hasAnyDestination(destinations) || (destinations.deck && !deckName.trim())}
          >
            Valider et appliquer
          </button>
        </ModalFooter>
      </SimpleModal>
    </div>
  )
}
