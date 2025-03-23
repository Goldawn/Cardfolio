import { useEffect, useState } from "react";
import styles from "./Card.module.css";
import CardModal from "./CardModal";

export default function Card({ card, cardList, currentIndex, isFrontAndBack, onAddToCollection, updateQuantity, onRemove, owned = false, currency = "eur" }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fonction pour récupérer le dernier prix connu
  const getLastPrice = (card, currency) => {
    if (!card.priceHistory || card.priceHistory.length === 0) {
      return 0;
    }
    return card.priceHistory.slice(-1)[0][currency] || 0;
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  }
  
  const handleCloseModal = () => setIsModalOpen(false);

  // Sélection du nom correct
  const cardName = isFrontAndBack ? card.name.split(" // ")[0] : card.name;

  // Récupération du dernier prix
  const lastPrice = getLastPrice(card, currency);
  const totalValue = (lastPrice * card.quantity).toFixed(2);

  return (
    <div className={styles.card}>
        <img className={ owned ? styles.owned : ""} src={card.image.small} alt={cardName} onClick={handleOpenModal} />
      <h3>{cardName}</h3>

      {onAddToCollection && <button onClick={() => onAddToCollection(card)}>Ajouter à la collection</button>}

      {updateQuantity && (
        <>
          <div className={styles.details}>
            <p>Quantité : {owned ? card.quantity : 0}</p>
            <p>Prix unitaire : {Number(lastPrice).toFixed(2)} {currency === "eur" ? "€" : "$"}</p>
            <p>Valeur totale : {totalValue} {currency === "eur" ? "€" : "$"}</p>
          </div>
          <div className={styles.actionBox}>
            <div className={styles.quantityBtnBox}>
              <button className={styles.remove} onClick={() => updateQuantity(card.id, -1)}>-1</button>
              <button className={styles.add} onClick={() => updateQuantity(card.id, 1)}>+1</button>
            </div>
          </div>
        </>
      )}

      {onRemove && <button className={styles.delete} onClick={() => onRemove(card.id)}>Supprimer</button>}

      {isModalOpen &&
        <CardModal 
          card={card} 
          onClose={handleCloseModal}
          cardList={cardList} // toutes les cartes affichées
          currentIndex={currentIndex} // position de la carte dans cette liste
        />
        }
    </div>
  );
}
