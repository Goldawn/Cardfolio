// /components/ColsControl.jsx
import styles from "./ColsControl.module.css"; // ou réutilise DeckCardsTabs.module.css si tu préfères

export default function ColsControl({
  viewId,
  sortKey,
  value,
  onChange,
  disabled = false,
}) {
  return (
    <label className={styles.sortWrapper} title="Nombre de colonnes">
      <span className={styles.sortLabel}>Colonnes</span>
      <div className={styles.colsGroup} role="group" aria-label="Colonnes">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            className={`${styles.colsBtn} ${value === n ? styles.colsBtnActive : ""}`}
            aria-pressed={value === n}
            disabled={disabled}
            onClick={() => !disabled && onChange(n)}
            title={`Afficher en ${n} colonne${n > 1 ? "s" : ""}${disabled ? " (non disponible pour ce tri)" : ""}`}
          >
            {n}
          </button>
        ))}
      </div>
    </label>
  );
}
