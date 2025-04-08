import { useEffect, useState } from "react";
import styles from "./Card.module.css";
import CardModal from "./CardModal";

export default function Card({
  card,
  currency = "eur",
  className = "",
  cardList,
  currentIndex,

  // Features (flags)
  showName = true,
  showSet = false,
  showQuantity = false,
  showWishlistedQuantity = false,
  showPrice = false,
  editableQuantity = false,
  showAddToCollectionButton = false,
  showAddToWishlistButton = false,
  showDeleteButton = false,
  compareWithCollection = false,
  modal = true,
  disabled = false,

  // Actions (callbacks)
  onAddToCollection,
  onAddToWishlist,
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

  const handleOpenModal = () => {
    if (!modal || disabled) return;
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleClick = () => {
    if (disabled) return;
    if (undoAddToCollection) {
      undoAddToCollection(card);
    }
  };

  console.log(card)

  const isOwned = card.quantity > 0;
  const cardClass = compareWithCollection && !isOwned ? styles.notOwned : "";

  return (
    <div className={`${styles.card} ${className}`} onClick={handleClick}>
      <img
        className={`${cardClass}`}
        src={card.image.small}
        alt={cardName}
        onClick={handleOpenModal}
      />

      {showName && <h3>{cardName}</h3>}

      {showSet && card.setCode && <p className={styles.set}>{card.setCode.toUpperCase()}</p>}
    
    <div className={styles.cardButtonContainer}>
      {showAddToCollectionButton && onAddToCollection && (
        <button className={styles.addCollectionButton} onClick={() => onAddToCollection(card)} disabled={disabled}>
          Ajouter
        </button>
      )}

      {showAddToWishlistButton && onAddToWishlist && (
        <button className={styles.wishlistButton} title="Ajouter à la wishlist" onClick={() => onAddToWishlist(card)} disabled={disabled}>
          Wishlist
        </button>
      )}
    </div>

      {showQuantity && <p>Quantité : {card.quantity}</p>}

      {showWishlistedQuantity && (
        <p className={styles.wishlistInfo}>
            Souhaitée : {card.wishlistQuantity}
        </p>
      )}


      {showPrice && (
        <>
          <p>Prix unitaire : {Number(lastPrice).toFixed(2)} {currency === "eur" ? "€" : "$"}</p>
          <p>Valeur totale : {totalValue} {currency === "eur" ? "€" : "$"}</p>
        </>
      )}

      {editableQuantity && updateQuantity && (
        <div className={styles.actionBox}>
          <div className={styles.quantityBtnBox}>
            <button
              className={styles.remove}
              onClick={() => updateQuantity(card.id, -1)}
              disabled={disabled}
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

      {showDeleteButton && onRemove && (
        <button
          className={styles.delete}
          onClick={() => onRemove(card.id)}
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