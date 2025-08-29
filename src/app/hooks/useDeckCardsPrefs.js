import { useEffect, useMemo, useState } from "react";

/** Clés LS actuelles (nouvelles) */
const LS_PREFIX = "deckCards.";
const LS_KEYS = {
  view:       LS_PREFIX + "view",
  edit:       LS_PREFIX + "edit",
  legality:   LS_PREFIX + "legality",
  sortKey:    LS_PREFIX + "sortKey",
  cols:       LS_PREFIX + "colsByView",
};

/** Defaults */
const DEFAULTS = {
  view: "grid",              // "grid" | "list" | "compact" | "piles" | "listByType"
  edit: false,
  legality: false,
  sortKey: "mv",             // "mv" | "name" | "type" | "color"
  colsByView: {              // nb colonnes par vue (quand activé)
    compact: 2,
    list: 2,
    grid: 2,                 // utilisé seulement quand c’est autorisé (type/couleur)
    piles: 2,                // idem
    listByType: 2,           // si besoin
  },
};

/** Utilitaires LS sûrs + migration */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function readBool(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === "1" || raw === "true";
  } catch {
    return fallback;
  }
}
function writeBool(key, value) {
  try { localStorage.setItem(key, value ? "1" : "0"); } catch {}
}

/** Migration depuis tes anciennes clés si présentes */
function migrateOldKeys() {
  try {
    // anciennes clés
    const old = {
      view:      localStorage.getItem("deckCards.view"),
      edit:      localStorage.getItem("deckCards.edit"),
      legality:  localStorage.getItem("deckCards.legality"),
      sortKey:   localStorage.getItem("deckCards.sortKey"),
      cols:      localStorage.getItem("deckCards.cols"), // ancien format possible
    };

    // si nouvelles déjà présentes, on ne touche pas
    if (localStorage.getItem(LS_KEYS.view) != null) return;

    if (old.view != null)      localStorage.setItem(LS_KEYS.view, old.view);
    if (old.edit != null)      writeBool(LS_KEYS.edit, old.edit === "1" || old.edit === "true");
    if (old.legality != null)  writeBool(LS_KEYS.legality, old.legality === "1" || old.legality === "true");
    if (old.sortKey != null)   localStorage.setItem(LS_KEYS.sortKey, JSON.stringify(old.sortKey));

    if (old.cols) {
      // Si tu stockais {grid, list, masonry} avant, on mappe vers colsByView
      try {
        const parsed = JSON.parse(old.cols);
        const colsByView = {
          ...DEFAULTS.colsByView,
          compact: Number(parsed?.masonry) || DEFAULTS.colsByView.compact,
          list:    Number(parsed?.list)    || DEFAULTS.colsByView.list,
          grid:    Number(parsed?.grid)    || DEFAULTS.colsByView.grid,
          // piles/listByType si tu veux reprendre "masonry"
          piles:   Number(parsed?.masonry) || DEFAULTS.colsByView.piles,
          listByType: Number(parsed?.masonry) || DEFAULTS.colsByView.listByType,
        };
        writeJSON(LS_KEYS.cols, colsByView);
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
export function useDeckCardsPrefs() {
  // migration one-shot
  useEffect(() => migrateOldKeys(), []);

  const [active, setActive] = useState(() => readJSON(LS_KEYS.view, DEFAULTS.view));
  const [editMode, setEditMode] = useState(() => readBool(LS_KEYS.edit, DEFAULTS.edit));
  const [showLegality, setShowLegality] = useState(() => readBool(LS_KEYS.legality, DEFAULTS.legality));
  const [sortKey, setSortKey] = useState(() => readJSON(LS_KEYS.sortKey, DEFAULTS.sortKey));
  const [colsByView, setColsByView] = useState(() => readJSON(LS_KEYS.cols, DEFAULTS.colsByView));

  // persist
  useEffect(() => writeJSON(LS_KEYS.view, active), [active]);
  useEffect(() => writeBool(LS_KEYS.edit, editMode), [editMode]);
  useEffect(() => writeBool(LS_KEYS.legality, showLegality), [showLegality]);
  useEffect(() => writeJSON(LS_KEYS.sortKey, sortKey), [sortKey]);
  useEffect(() => writeJSON(LS_KEYS.cols, colsByView), [colsByView]);

  // helpers colonnes
  const clampCols = (n) => Math.max(1, Math.min(3, Number(n) || 1));
  const setColsFor = useMemo(
    () => (view, n) =>
      setColsByView((prev) => ({ ...prev, [view]: clampCols(n) })),
    []
  );
  const getColsFor = useMemo(
    () => (view) => clampCols((colsByView?.[view] ?? 2)),
    [colsByView]
  );

  // Politique d’activation des boutons colonnes (à centraliser ici)
  const isColsEnabled = useMemo(
    () => (view, key) => {
      // compact & list : toujours permis
      if (view === "compact" || view === "list") return true;
      // grid & piles : seulement quand tri par type/couleur
      if (view === "grid" && (key === "type" || key === "color")) return true;
      if (view === "stack" && (key === "type" || key === "color")) return true;
      // listByType : up to you (ex: autorisé)
      if (view === "listByType") return true;
      return false;
    },
    []
  );

  return {
    // state
    active, setActive,
    editMode, setEditMode,
    showLegality, setShowLegality,
    sortKey, setSortKey,

    // colonnes
    colsByView,
    getColsFor,
    setColsFor,
    isColsEnabled,
  };
}

export default useDeckCardsPrefs;