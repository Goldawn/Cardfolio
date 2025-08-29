"use client";
import { Fragment } from "react";
import Image from "next/image";
import styles from "./DeckCardsTabs.module.css";
import {
  getMV,
  getArtSmall,
  getArtLarge,
  getShowcasePayload,
  rarityKeyOf,
  formatAndParseText,
} from "@/lib/mtgCards";

export default function DeckRow({
  card,
  deckState,
  editMode,
  isPending,
  showLegality,
  updateDeckCardQty,
  removeCardFromDeck,
  setShowcased,
  getRowHoverHandlers,
  problems = [],
  variant = "list",
}) {

  const hasThumb   = variant === "list";
  const hasQty     = true;
  const hasActions = true;
  const hasRarity  = true;

  const nonRarityColCount =
  (hasThumb ? 1 : 0)
  + 1
  + (hasQty ? 1 : 0)
  + (hasActions ? 1 : 0);

  const qty = Number(card?.decklistQuantity || 0);
  if (!qty) return null;

  const isShowcased = String(deckState?.showcasedDeckCardId ?? "") === String(card?.deckCardId ?? "");
  const rowProblem = showLegality && problems.length > 0;

  // Rareté -> classes CSS
  const rarity = rarityKeyOf(card);
  const rarityClass =
    {
      common: styles.rarityCommon,
      uncommon: styles.rarityUncommon,
      rare: styles.rarityRare,
      mythic: styles.rarityMythic,
      special: styles.raritySpecial,
      other: styles.rarityOther,
    }[rarity] || styles.rarityOther;

  // Hover preview (si dispo)
  const hoverHandlers =
    getRowHoverHandlers
      ? getRowHoverHandlers({ url: getArtLarge(card), name: card.name || card.printedName })
      : {};

  // Actions quantité
  const onDec = () => updateDeckCardQty(card.deckCardId, Math.max(0, qty - 1));
  const onInc = () => updateDeckCardQty(card.deckCardId, qty + 1);
  const onDelete = () => removeCardFromDeck(card.deckCardId);
  const onToggleShowcase = () => setShowcased(card.deckCardId, getShowcasePayload(card));

  // Champs partagés
  const name = card.name || card.printedName || "";
  const typeLine = card.type || card.typeLine || "";
  const manaCostNode = formatAndParseText(card.manaCost);
  const mv = getMV(card); // numérique (pour tooltip CMC côté compact)
  const artSmall = getArtSmall(card);

  // === Rendu selon variant ===
  if (variant === "compact") {
    return (
      <Fragment>
        <tr className={rowProblem ? styles.rowProblem : ""} {...hoverHandlers}>
          {/* Qté */}
          <td className={styles.qtyCell}>
            {editMode ? (
              <>
                <button onClick={onDec} disabled={isPending || deckState?.isLocked || qty <= 1}>−</button>
                <span className={styles.qtyValue}>{qty}</span>
                <button onClick={onInc} disabled={isPending || deckState?.isLocked}>+</button>
              </>
            ) : (
              <span className={styles.qtyValueStatic}>{qty}</span>
            )}
          </td>

          {/* Nom + type */}
          <td className={styles.nameCell}>
            <span className={styles.listName}>{name}</span>
            <span className={styles.typeLine}>{typeLine}</span>
          </td>

          {/* CMC visuel */}
          <td className={styles.cmcCell} title={mv != null ? `CMC ${mv}` : undefined}>
            <span className={styles.cmcMana}>{manaCostNode || (mv ?? "—")}</span>
          </td>

          {/* Actions */}
          <td className={styles.actionsCell}>
            <button
              onClick={onToggleShowcase}
              title={isShowcased ? "Retirer de la mise en avant" : "Mettre en avant"}
              aria-pressed={isShowcased}
              className={`${styles.starBtn} ${isShowcased ? styles.starFull : styles.starEmpty}`}
            >
              {isShowcased ? "★" : "☆"}
            </button>

            {editMode && (
              <button onClick={onDelete} disabled={isPending || deckState?.isLocked} className={styles.danger}>
                Supprimer
              </button>
            )}
          </td>

          {/* Barre de rareté */}
          <td className={styles.rarityCell} aria-hidden="true">
            <span className={`${styles.rarityBar} ${rarityClass}`} />
          </td>
        </tr>

        {rowProblem && (
          <tr>
            {/* compact = 5 colonnes */}
            <td colSpan={5} className={styles.problemLine}>{problems.join(" • ")}</td>
          </tr>
        )}
      </Fragment>
    );
  }

  // === variant === "list"
  return (
    <Fragment>
      <tr className={rowProblem ? styles.rowProblem : ""} {...hoverHandlers}>
         {hasThumb && (
          <td className={styles.cellThumb}>
            {artSmall ? (
              <img src={artSmall} alt={name} className={styles.artThumbSmall} />
            ) : (
              <div className={styles.noArtSmall} />
            )}
          </td>
        )}

        {/* Titre + coût */}
        <td className={styles.titleAndManacost}>
          <div className={styles.titleWrap}>
            <span className={styles.listName}>{name}</span>
            <span className={styles.manaCost}>{manaCostNode}</span>
          </div>
        </td>

        {hasQty && (
          <td className={styles.qtyCell}>
            {editMode ? (
              <>
                <button onClick={onDec} disabled={isPending || deckState?.isLocked || qty <= 1}>−</button>
                <span className={styles.qtyValue}>{qty}</span>
                <button onClick={onInc} disabled={isPending || deckState?.isLocked}>+</button>
              </>
            ) : (
              <span className={styles.qtyValueStatic}>{qty}</span>
            )}
          </td>
        )}

        {hasActions && (
          <td className={styles.actionsCell}>
            <button
              onClick={onToggleShowcase}
              title={isShowcased ? "Retirer de la mise en avant" : "Mettre en avant"}
              aria-pressed={isShowcased}
              className={`${styles.starBtn} ${isShowcased ? styles.starFull : styles.starEmpty}`}
            >
              {isShowcased ? "★" : "☆"}
            </button>
          </td>
        )}

        {/* Supprimer */}
        {editMode && (
          <td>
            <button onClick={onDelete} disabled={isPending || deckState?.isLocked} className={styles.danger}>
              Supprimer
            </button>
          </td>
        )}

      {hasRarity && (
        <td className={styles.rarityCell} aria-hidden="true">
          <span className={`${styles.rarityBar} ${rarityClass}`} />
        </td>
      )}

      </tr>

      {rowProblem && (
        <tr>
          <td colSpan={nonRarityColCount} className={styles.problemLine}>
            {problems.join(" • ")}
          </td>
          {hasRarity && (
            // on garde une cellule rareté vide pour respecter la grille de colonnes
            <td className={styles.rarityCell} aria-hidden="true" />
          )}
        </tr>
      )}
    </Fragment>
  );
}