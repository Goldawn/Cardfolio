"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./SplitButton.module.css";

export default function SplitButton({
  lists = [],
  defaultListId,
  onQuickAdd,      // (listId, card) => Promise<void>
  onCreateWishlist,    // (name) => Promise<string|null> -> retourne le nouvel id
  card,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedList, setSelectedList] = useState(defaultListId || (lists[0]?.id ?? null));
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [pending, setPending] = useState(false);
  const menuRef = useRef(null);

  // Suivre les props si elles changent
  useEffect(() => {
    if (defaultListId) setSelectedList(defaultListId);
    else if (!selectedList && lists.length > 0) setSelectedList(lists[0].id);
  }, [defaultListId, lists.length]);

  // Ferme le menu si clic à l’extérieur
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Esc pour fermer
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const handleListSelect = (listId) => {
    setSelectedList(listId);
    setMenuOpen(false);
  };

  // Clic "Wishlist" (action rapide)
  const handleQuickAdd = async () => {
    try {
      setPending(true);

      // Si on n’a AUCUNE liste -> on crée "wishlist" puis on ajoute
      let targetListId = selectedList;
      if (!targetListId) {
        if (!onCreateWishlist) return; // garde-fou
        const createdId = await onCreateWishlist("wishlist");
        if (!createdId) return;
        targetListId = createdId;
        setSelectedList(createdId);
      }

      await onQuickAdd?.(targetListId, card);
    } finally {
      setPending(false);
    }
  };

  // Création depuis le menu
const handleCreateFromMenu = async () => {
    const name = (newListName || "").trim() || "wishlist";
    if (!onCreateWishlist) return;
    try {
      setCreating(true);
      const id = await onCreateWishlist(name);
      if (!id) return;
      // ✅ Ne PAS ajouter la carte ici.
      // On sélectionne la nouvelle liste et on laisse le menu ouvert
      // (pour que l’utilisateur puisse cliquer ensuite sur "Wishlist" ou refermer).
      setSelectedList(id);
      setNewListName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.splitButton} ref={menuRef}>
      {/* Bouton gauche (action rapide) */}
      <button
        className={styles.splitButtonLeft}
        onClick={handleQuickAdd}
        disabled={pending}
        aria-label="Ajouter à la wishlist (ajout rapide)"
        title="Ajouter à la wishlist"
      >
        {pending ? "…" : "Wishlist"}
      </button>

      {/* Bouton droit (ouvre menu) */}
      <button
        className={styles.splitButtonRight}
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        title="Choisir une wishlist"
      >
        ▼
      </button>

      {/* Menu déroulant */}
      {menuOpen && (
        <div className={styles.splitButtonMenu} role="menu">
          {/* Listes existantes */}
          {lists.length > 0 ? (
            lists.map((list) => (
              <label key={list.id} className={styles.splitButtonOption} role="menuitemradio" aria-checked={selectedList === list.id}>
                <input
                  type="radio"
                  name="wishlist"
                  checked={selectedList === list.id}
                  onChange={() => handleListSelect(list.id)}
                />
                {list.name}
              </label>
            ))
          ) : (
            <div className={styles.splitButtonEmpty}>Aucune liste pour le moment.</div>
          )}

          {/* Séparateur */}
          <div className={styles.splitButtonSeparator} />

          {/* Création d’une nouvelle liste */}
          <div className={styles.createRow}>
            <input
              type="text"
              placeholder="Nom de la nouvelle liste"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFromMenu();
              }}
              disabled={creating}
            />
            <button onClick={handleCreateFromMenu} disabled={creating}>
              {creating ? "…" : "Créer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
