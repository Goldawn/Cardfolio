import { useEffect, useMemo, useState } from 'react'

type ViewType = 'grid' | 'list' | 'compact' | 'piles'
type SortKey = 'mv' | 'name' | 'type' | 'color'

interface ColsByView {
  compact: number
  list: number
  grid: number
  piles: number
}

interface DeckCardsPrefs {
  view: ViewType
  edit: boolean
  legality: boolean
  sortKey: SortKey
  colsByView: ColsByView
}

/** Clés LS actuelles (nouvelles) */
const LS_PREFIX = 'deckCards.'
const LS_KEYS = {
  view: LS_PREFIX + 'view',
  edit: LS_PREFIX + 'edit',
  legality: LS_PREFIX + 'legality',
  sortKey: LS_PREFIX + 'sortKey',
  cols: LS_PREFIX + 'colsByView',
}

/** Defaults */
const DEFAULTS: DeckCardsPrefs = {
  view: 'grid', // "grid" | "list" | "compact" | "piles" | "listByType"
  edit: false,
  legality: false,
  sortKey: 'mv', // "mv" | "name" | "type" | "color"
  colsByView: {
    // nb colonnes par vue (quand activé)
    compact: 2,
    list: 2,
    grid: 2, // utilisé seulement quand c'est autorisé (type/couleur)
    piles: 2, // idem
  },
}

/** Utilitaires LS sûrs + migration */
function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}
function writeJSON(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}
function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return raw === '1' || raw === 'true'
  } catch {
    return fallback
  }
}
function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {}
}

/** Migration depuis tes anciennes clés si présentes */
function migrateOldKeys() {
  try {
    // anciennes clés
    const old = {
      view: localStorage.getItem('deckCards.view'),
      edit: localStorage.getItem('deckCards.edit'),
      legality: localStorage.getItem('deckCards.legality'),
      sortKey: localStorage.getItem('deckCards.sortKey'),
      cols: localStorage.getItem('deckCards.cols'), // ancien format possible
    }

    // si nouvelles déjà présentes, on ne touche pas
    if (localStorage.getItem(LS_KEYS.view) != null) return

    if (old.view != null) localStorage.setItem(LS_KEYS.view, old.view)
    if (old.edit != null)
      writeBool(LS_KEYS.edit, old.edit === '1' || old.edit === 'true')
    if (old.legality != null)
      writeBool(
        LS_KEYS.legality,
        old.legality === '1' || old.legality === 'true'
      )
    if (old.sortKey != null)
      localStorage.setItem(LS_KEYS.sortKey, JSON.stringify(old.sortKey))

    if (old.cols) {
      // Si tu stockais {grid, list, masonry} avant, on mappe vers colsByView
      try {
        const parsed = JSON.parse(old.cols)
        const colsByView = {
          ...DEFAULTS.colsByView,
          compact: Number(parsed?.masonry) || DEFAULTS.colsByView.compact,
          list: Number(parsed?.list) || DEFAULTS.colsByView.list,
          grid: Number(parsed?.grid) || DEFAULTS.colsByView.grid,
          // piles si tu veux reprendre "masonry"
          piles: Number(parsed?.masonry) || DEFAULTS.colsByView.piles,
        }
        writeJSON(LS_KEYS.cols, colsByView)
      } catch {}
    }
  } catch {}
}

/**
 * Hook centralisé pour l’état UI & préférences “DeckCards”.
 * - Hydrate / persiste sur localStorage
 * - Centralise les colonnes par vue avec helpers get/set
 * - Expose un “isColsEnabled(view, sortKey)” pour activer/désactiver les boutons
 */
export function useDeckCardsPrefs(): {
  prefs: DeckCardsPrefs
  setView: (view: ViewType) => void
  setEdit: (edit: boolean) => void
  setLegality: (legality: boolean) => void
  setSortKey: (sortKey: SortKey) => void
  setCols: (view: ViewType, cols: number) => void
  getCols: (view: ViewType) => number
  isColsEnabled: (view: ViewType, sortKey: SortKey) => boolean
} {
  // migration one-shot
  useEffect(() => migrateOldKeys(), [])

  const [active, setActive] = useState(() =>
    readJSON(LS_KEYS.view, DEFAULTS.view)
  )
  const [editMode, setEditMode] = useState(() =>
    readBool(LS_KEYS.edit, DEFAULTS.edit)
  )
  const [showLegality, setShowLegality] = useState(() =>
    readBool(LS_KEYS.legality, DEFAULTS.legality)
  )
  const [sortKey, setSortKey] = useState(() =>
    readJSON(LS_KEYS.sortKey, DEFAULTS.sortKey)
  )
  const [colsByView, setColsByView] = useState(() =>
    readJSON(LS_KEYS.cols, DEFAULTS.colsByView)
  )

  // persist
  useEffect(() => writeJSON(LS_KEYS.view, active), [active])
  useEffect(() => writeBool(LS_KEYS.edit, editMode), [editMode])
  useEffect(() => writeBool(LS_KEYS.legality, showLegality), [showLegality])
  useEffect(() => writeJSON(LS_KEYS.sortKey, sortKey), [sortKey])
  useEffect(() => writeJSON(LS_KEYS.cols, colsByView), [colsByView])

  // helpers colonnes
  const clampCols = (n: any): number => Math.max(1, Math.min(3, Number(n) || 1))
  const setColsFor = useMemo(
    () => (view: ViewType, n: any) =>
      setColsByView(prev => ({ ...prev, [view]: clampCols(n) })),
    []
  )
  const getColsFor = useMemo(
    () => (view: ViewType): number => clampCols(colsByView?.[view] ?? 2),
    [colsByView]
  )

  // Politique d'activation des boutons colonnes (à centraliser ici)
  const isColsEnabled = useMemo(
    () => (view: ViewType, key: SortKey): boolean => {
      // compact & list : toujours permis
      if (view === 'compact' || view === 'list') return true
      // grid & piles : seulement quand tri par type/couleur
      if (view === 'grid' && (key === 'type' || key === 'color')) return true
      if (view === 'piles' && (key === 'type' || key === 'color')) return true
      return false
    },
    []
  )

  return {
    // state
    prefs: {
      view: active,
      edit: editMode,
      legality: showLegality,
      sortKey: sortKey,
      colsByView: colsByView
    },
    setView: setActive,
    setEdit: setEditMode,
    setLegality: setShowLegality,
    setSortKey: setSortKey,
    setCols: setColsFor,
    getCols: getColsFor,
    isColsEnabled: isColsEnabled,
  }
}

export default useDeckCardsPrefs
