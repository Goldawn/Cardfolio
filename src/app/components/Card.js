"use client";

import { useState } from "react";
import styles from "./Card.module.css";
import CardModal from "./CardModal";
import SplitButton from "./SplitButton.tsx";

export default function Card({
  card,
  wishlistLists = [],
  currency = "eur",
  className = "",
  cardList,
  currentIndex,

  // Features (flags)
  showName = true,
  showSet = false,
  showQuantity = false,
  showWishlistQuantity = false,
  showDecklistQuantity = false,
  showPrice = false,
  showAddToCollectionButton = false,
  showAddToWishlistButton = false,
  showAddToDeckButton = false,
  showDeleteButton = false,
  compareWithCollection = false,
  modal = true,
  disabled = false,

  // Actions (callbacks)
  onAddToCollection,
  onAddToWishlist,
  onAddToDeck,
  onRemove,
  updateQuantity,
  undoAddToCollection,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getLastPrice = (card, currency) => {
    if (!card.priceHistory || card.priceHistory.length === 0) return 0;
    return card.priceHistory.slice(-1)[0][currency] || 0;
  };

  const cardName = card.name?.split(" // ")[0] || "Nom inconnu";
  const lastPrice = getLastPrice(card, currency);
  const totalValue = (lastPrice * (card.quantity || 1)).toFixed(2);

  const handleOpenModal = (e) => {
    e.stopPropagation();                 // <-- évite de déclencher undoAdd
    if (!modal || disabled) return;
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleRootClick = () => {
    if (disabled) return;
    if (undoAddToCollection) {
      undoAddToCollection(card);
    }
  };

  const stop = (e) => e.stopPropagation(); // utile pour les boutons

  const isOwned = card.quantity > 0;
  const cardClass = compareWithCollection && !isOwned ? styles.notOwned : "";

  // Default list: si tu as un flag "isDefault" sur tes listes, privilégie-le ici
  const defaultListId = wishlistLists[0]?.id;

  return (
    <div className={`${styles.card} ${className}`} onClick={handleRootClick}>
      <img
        className={`${cardClass}`}
        src={card.image?.small || card.image?.normal || "/placeholder.png"}  // <-- fallback
        alt={cardName}
        onClick={handleOpenModal}
      />

      {showName && <h3>{cardName}</h3>}

      {showSet && card.setCode && (
        <p className={styles.set}>{card.setCode.toUpperCase()}</p>
      )}

      <div className={styles.cardButtonContainer} onClick={stop}>
        {showAddToCollectionButton && onAddToCollection && card.quantity === 0 && (
          <button
            className={styles.addCollectionButton}
            onClick={() => onAddToCollection(card)}
            disabled={disabled}
          >
            Ajouter
          </button>
        )}

        {showAddToWishlistButton && onAddToWishlist && wishlistLists.length > 0 && (
          <SplitButton
            lists={wishlistLists}
            defaultListId={defaultListId}
            onQuickAdd={(listId) => onAddToWishlist(listId, card)}
            card={card}
          />
        )}

        {showAddToDeckButton && onAddToDeck && (
          <button
            className={styles.wishlistButton}
            title="Ajouter au deck"
            onClick={(e) => { e.stopPropagation(); onAddToDeck(card); }}
            disabled={disabled}
          >
            Ajouter au deck
          </button>
        )}
      </div>

      {showQuantity && <p>Dans la collection : {card.quantity}</p>}
      {showWishlistQuantity && (
        <p>Dans la wishlist : {card.wishlistQuantity}</p>
      )}
      {showDecklistQuantity && (
        <p>Dans la decklist : {card.decklistQuantity}</p>
      )}

      {showPrice && (
        <>
          <p>
            Prix unitaire : {Number(lastPrice).toFixed(2)}{" "}
            {currency === "eur" ? "€" : "$"}
          </p>
          <p>
            Valeur totale : {totalValue} {currency === "eur" ? "€" : "$"}
          </p>
        </>
      )}

      {updateQuantity && card.quantity > 0 && (
        <div className={styles.actionBox} onClick={stop}>
          <div className={styles.quantityBtnBox}>
            <button
              className={styles.remove}
              onClick={() => updateQuantity(card.id, -1)}
              disabled={disabled || card.quantity <= 1}
            >
              -1
            </button>
            <button
              className={styles.add}
              onClick={() => updateQuantity(card.id, 1)}
              disabled={disabled}
            >
              +1
            </button>
          </div>
        </div>
      )}

      {showDeleteButton && onRemove && card.quantity > 0 && (
        <button
          className={styles.delete}
          onClick={(e) => { e.stopPropagation(); onRemove(card.id); }}
          disabled={disabled}
        >
          Supprimer
        </button>
      )}

      {modal && isModalOpen && (
        <CardModal
          card={card}
          onClose={handleCloseModal}
          cardList={cardList}
          currentIndex={currentIndex}
        />
      )}
    </div>
  );
}
