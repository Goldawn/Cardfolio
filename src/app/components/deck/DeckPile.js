"use client";
import styles from "./DeckCardsTabs.module.css";
import { getArtLarge, getShowcasePayload } from "@/lib/mtgCards";

export default function DeckPile({
  card,
  qty,
  deckState,
  editMode,
  isPending,
  setShowcased,
  updateDeckCardQty,
  removeCardFromDeck,
  showLegality,
  config,
  problems,
  isProblem,
}) {
  const { CARD_W = 140, CARD_H = 200, OFFSET_Y = 20, CAP = Infinity } = config || {};
  const visible = Math.min(qty, CAP);
  const stackH = CARD_H + Math.max(0, visible - 1) * OFFSET_Y;

  const art = getArtLarge(card);
  const isShowcased = String(deckState?.showcasedDeckCardId ?? "") === String(card?.deckCardId ?? "");

  // Légalité (robuste aux deux façons d'appeler le composant)
  const probList = Array.isArray(problems) ? problems : [];
  const showProb = typeof isProblem === "boolean" ? isProblem : (showLegality && probList.length > 0);

  const dec = () => updateDeckCardQty(card.deckCardId, Math.max(0, qty - 1));
  const inc = () => updateDeckCardQty(card.deckCardId, qty + 1);
  const del = () => removeCardFromDeck(card.deckCardId);
  const locked = isPending || !!deckState?.isLocked;

  return (
    <li
      className={styles.pileItem}
      style={{
        width: CARD_W + 20,
        borderColor: showProb ? "#e67e22" : "rgba(255,255,255,0.1)",
      }}
      title={showProb ? probList.join(" • ") : undefined}
    >
      <button
        className={`${styles.toggleShowcased} ${isShowcased ? styles.showcased : ""}`}
        onClick={() => setShowcased(card.deckCardId, getShowcasePayload(card))}
        title={isShowcased ? "Carte mise en avant" : "Définir comme showcased"}
      >
        {isShowcased ? "★" : "☆"}
      </button>

      <div className={styles.stackThumb} style={{ width: CARD_W, height: stackH }}>
        {Array.from({ length: visible }).map((_, i) => (
          <div
            key={i}
            className={styles.stackLayer}
            style={{ width: CARD_W, height: CARD_H, transform: `translate(0, ${i * OFFSET_Y}px)` }}
          >
            {art ? <img src={art} alt={card.name || ""} /> : <div className={styles.stackPlaceholder} />}
          </div>
        ))}
        {qty > visible && <span className={styles.stackBadge}>×{qty}</span>}
      </div>

      {/* Nom + contrôles inline */}
      <div className={styles.pileMeta}>
        <div className={styles.pileName}>{card.name || card.printedName}</div>
        {editMode && (
          <div className={styles.pileControls}>
            <button onClick={dec} disabled={locked || qty <= 1}>−1</button>
            <button onClick={inc} disabled={locked}>+1</button>
            <button onClick={del} disabled={locked} className={styles.danger}>
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Ligne d’alerte (texte) sous la pile */}
      {showProb && probList.length > 0 && (
        <div className={styles.problemLine}>{probList.join(" • ")}</div>
      )}
    </li>
  );
}