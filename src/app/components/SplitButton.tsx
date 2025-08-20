"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./SplitButton.module.css";

export default function SplitButton({ lists, defaultListId, onQuickAdd, card }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedList, setSelectedList] = useState(defaultListId);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ferme le menu si clic à l’extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sélection d’une liste
  const handleListSelect = (listId: string) => {
    setSelectedList(listId);
    setMenuOpen(false); // on ferme le menu après le choix
  };

  return (
    <div className={styles.splitButton} ref={menuRef}>
      {/* Bouton gauche (action rapide) */}
      <button
        className={styles.splitButtonLeft}
        onClick={() => onQuickAdd(selectedList, card)}
      >
        Wishlist
      </button>

      {/* Bouton droit (ouvre menu) */}
      <button
        className={styles.splitButtonRight}
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
      >
        ▼
      </button>

      {/* Menu déroulant */}
      {menuOpen && (
        <div className={styles.splitButtonMenu}>
          {lists.map((list) => (
            <label key={list.id} className={styles.splitButtonOption}>
              <input
                type="radio"
                name="wishlist"
                checked={selectedList === list.id}
                onChange={() => handleListSelect(list.id)}
              />
              {list.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
