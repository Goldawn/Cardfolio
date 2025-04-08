"use client";

import { useState, useEffect, useMemo } from 'react';
import manaSymbols from '../assets/mock/mana.json';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './CardModal.module.css';
import useModalKeyboardNavigation from '../hooks/useModalKeyboardNavigation';
import { useCurrencyContext } from "@/context/";

export default function CardModal({ card, onClose, cardList = [], currentIndex = 0 }) {
  const [flipped, setFlipped] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(currentIndex);
  const currentCard = cardList[currentCardIndex] || card;

  const { currency, toggleCurrency } = useCurrencyContext();

  const handleNextCard = () => {
    if (currentCardIndex < cardList.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setFlipped(false);
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setFlipped(false);
    }
  };

  useModalKeyboardNavigation({
    isOpen: true,
    onClose,
    onNext: handleNextCard,
    onPrev: handlePreviousCard
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const formatAndParseText = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, lineIndex) => (
      <span key={lineIndex}>
        {line.split(/(\{[^}]+\})/g).filter(Boolean).map((symbol, symbolIndex) => {
          const foundSymbol = manaSymbols.data.find(entry => entry.symbol === symbol);
          return foundSymbol ? (
            <img key={`${lineIndex}-${symbolIndex}`} src={foundSymbol.svg_uri} alt={symbol} />
          ) : (
            symbol
          );
        })}
        <br />
      </span>
    ));
  };

  const isFrontAndBack = ["flip", "transform", "modal_dfc"].includes(currentCard.layout);
  const isDualFaceLayout = ["split", "adventure", "reversible_card"].includes(currentCard.layout);

  const displayedCard = useMemo(() => {
    if (isFrontAndBack && flipped) return currentCard.cardBack;
    return currentCard;
  }, [currentCard, flipped]);

  const formattedPriceHistory = useMemo(() => {
    if (!currentCard.priceHistory || currentCard.priceHistory.length === 0) return [];
    return currentCard.priceHistory
      .map(entry => ({
        date: entry.date,
        eur: parseFloat(entry.eur),
        usd: parseFloat(entry.usd),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [currentCard]);

  const getCurrentImage = () => {
    if (currentCard.layout === "reversible_card") {
      return flipped
        ? currentCard.reversibleImage?.large || currentCard.image?.large
        : currentCard.image?.large;
    }
    return currentCard.image?.large;
  };

  const renderCardFace = (cardData) => (
    <>
      <h2>{cardData.name}</h2>
      {cardData.manaCost && <p><strong>Coût de mana :</strong> {formatAndParseText(cardData.manaCost)}</p>}
      <p><strong>Type :</strong> {cardData.type}</p>
      {cardData.power && cardData.toughness && (
        <p><strong>Statistiques :</strong> {cardData.power}/{cardData.toughness}</p>
      )}
      {cardData.loyalty && <p><strong>Points de loyauté :</strong> {cardData.loyalty}</p>}
      {cardData.oracleText && <p><strong>Description :</strong> {formatAndParseText(cardData.oracleText)}</p>}
      {cardData.flavorText && <p><em>{formatAndParseText(cardData.flavorText)}</em></p>}
      {cardData.colors?.length > 0 && (
        <p><strong>Couleurs :</strong> {cardData.colors.join(", ")}</p>
      )}
    </>
  );

  return (
    <div className={styles.overlay} onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>×</button>

        {cardList.length > 1 && (
          <div className={styles.navButtons}>
            <button onClick={handlePreviousCard} disabled={currentCardIndex === 0}>
              ← {cardList[currentCardIndex - 1]?.name}
            </button>
            Carte {currentCardIndex + 1} / {cardList.length}
            <button onClick={handleNextCard} disabled={currentCardIndex === cardList.length - 1}>
              {cardList[currentCardIndex + 1]?.name} →
            </button>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.cardQuantityPanel}>
            {isFrontAndBack || currentCard.layout === "reversible_card" ? (
              <div key={currentCard.id} className={`${styles.cardContainer} ${styles.cardTransition}`}>
                <div className={`${styles.card} ${flipped ? styles.flipped : ''}`}>
                  <div className={styles.cardFace} style={{ backgroundImage: `url(${currentCard.image.large})` }}>
                    <button className={styles.flipButton} onClick={() => setFlipped(true)}>Voir le verso</button>
                  </div>
                  <div className={styles.cardFace} style={{ backgroundImage: `url(${currentCard.reversibleImage?.large || currentCard.cardBack?.image?.large})` }}>
                    <button className={styles.flipButton} onClick={() => setFlipped(false)}>Voir le recto</button>
                  </div>
                </div>
              </div>
            ) : (
              <div key={currentCard.id} className={`${styles.imageContainer} ${styles.cardTransition}`}>
                <img src={getCurrentImage()} alt={currentCard.name} className={styles.image} />
              </div>
            )}

            <div className={styles.quantityBox}>
              <p>Exemplaires possédés</p>
              <button>Ajouter un exemplaire</button>
              <button>Supprimer un exemplaire</button>
            </div>
          </div>

          <div className={styles.details}>
            {renderCardFace(displayedCard)}

            <p><strong>Rareté :</strong> {currentCard.rarity}</p>
            <p><strong>Set:</strong> {currentCard.setName} ({currentCard.setCode})</p>
            <p><strong>Numéro de collection :</strong> {currentCard.collectorNumber}</p>

            {isDualFaceLayout && currentCard.cardBack && (
              <>
                <p>---------------------------------------------------------</p>
                {renderCardFace(currentCard.cardBack)}
              </>
            )}

            <p>---------------------------------------------------------</p>
            <p><strong>Formats légaux :</strong></p>
            <ul className={styles.legalities}>
              {Object.entries(currentCard.legalities || {})
                .filter(([_, legality]) => legality === "legal")
                .map(([format]) => (
                  <li key={format}>{format}</li>
                ))}
            </ul>
            <p><strong>Illustrateur :</strong> {currentCard.artist}</p>
          </div>

          <div className={styles.tradingPanel}>
            {currentCard.priceHistory && currentCard.priceHistory.map((price) => (
              <p key={price.date}>
                <strong>{price.date} :</strong> {price[currency]} {currency === "eur" ? "€" : "$"}
              </p>
            ))}
            <button className={styles.update} onClick={toggleCurrency}>
              Afficher en {currency === "eur" ? "USD $" : "EUR €"}
            </button>
            <p>Prix moyen 30 jours :</p>
            <p>Prix moyen 7 jours :</p>
            <ResponsiveContainer width="100%" aspect={16 / 9}>
              <LineChart width={500} height={300} data={formattedPriceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" padding={{ left: 30, right: 30 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={currency} stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}