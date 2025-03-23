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
  const isDualCard = ["split", "adventure"].includes(currentCard.layout);

  const displayedCard = useMemo(() => {
    if (isFrontAndBack && flipped) return currentCard.cardBack;
    if (isDualCard) {

      return {
        ...currentCard,
        name: currentCard?.name,
        manaCost: currentCard?.manaCost,
        type: currentCard?.type,
        backFace: {
          name: currentCard.cardBack?.name,
          manaCost: currentCard.cardBack?.manaCost,
          type: currentCard.cardBack?.type,
          oracleText: currentCard.cardBack?.oracleText,
          flavorText: currentCard.cardBack?.flavorText,
          power: currentCard.cardBack?.power,
          toughness: currentCard.cardBack?.toughness,
        },
      };
    }
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

  return (
    <div className={styles.overlay} onClick={(e) => {
      if(e.target === e.currentTarget) {
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
            {isFrontAndBack ? (
              <div key={currentCard.id} className={`${styles.cardContainer} ${styles.cardTransition}`}>
                <div className={`${styles.card} ${flipped ? styles.flipped : ''}`}>
                  <div className={styles.cardFace} style={{ backgroundImage: `url(${currentCard.image.large})` }}>
                    <button className={styles.flipButton} onClick={() => setFlipped(true)}>Voir le verso</button>
                  </div>
                  <div className={styles.cardFace} style={{ backgroundImage: `url(${currentCard.cardBack.image.large})` }}>
                    <button className={styles.flipButton} onClick={() => setFlipped(false)}>Voir le recto</button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={currentCard.id} className={`${styles.imageContainer} ${styles.cardTransition}`}>
                <img src={currentCard.image.large} alt={currentCard.name} className={styles.image} />
              </div>
            )}

            <div className={styles.quantityBox}>
              <p>Exemplaires possédés</p>
              <button>Ajouter un exemplaire</button>
              <button>Supprimer un exemplaire</button>
            </div>
          </div>

          <div className={styles.details}>
            <h2>{displayedCard.name}</h2>
            {displayedCard.manaCost && <p><strong>Coût de mana :</strong> {formatAndParseText(displayedCard.manaCost)}</p>}
            <p><strong>Type :</strong> {displayedCard.type}</p>
            <p><strong>Rareté :</strong> {currentCard.rarity}</p>
            <p><strong>Set:</strong>{currentCard.setName} ({currentCard.setCode})</p>
            {displayedCard.power && displayedCard.toughness && (
              <p><strong>Statistiques :</strong> {displayedCard.power}/{displayedCard.toughness}</p>
            )}
            {displayedCard.loyalty && <p><strong>Points de loyauté :</strong> {displayedCard.loyalty}</p>}
            {displayedCard.oracleText && <p><strong>Description :</strong> {formatAndParseText(displayedCard.oracleText)}</p>}
            {displayedCard.flavorText && <p><em>{formatAndParseText(displayedCard.flavorText)}</em></p>}
            <p><strong>Numéro de collection :</strong> {currentCard.collectorNumber}</p>
            {displayedCard.colors?.length > 0 && (
              <p><strong>Couleurs :</strong> {displayedCard.colors.join(", ")}</p>
            )}

            {displayedCard.backFace && (
              <>
                <p>---------------------------------------------------------</p>
                <h2>{displayedCard.backFace.name}</h2>
                <p><strong>Coût de mana :</strong> {formatAndParseText(displayedCard.backFace.manaCost)}</p>
                <p><strong>Type :</strong> {displayedCard.backFace.type}</p>
                {displayedCard.backFace.power && displayedCard.backFace.toughness && <p><strong>Statistiques :</strong> {displayedCard.backFace.power}/{displayedCard.backFace.toughness}</p>}
                {displayedCard.backFace.oracleText && <p><strong>Description :</strong> {formatAndParseText(displayedCard.backFace.oracleText)}</p>}
                {displayedCard.backFace.flavorText && <p><em>{formatAndParseText(displayedCard.backFace.flavorText)}</em></p>}
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
            <p><strong>Illustrateur :</strong>{currentCard.artist}</p>
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
            <ResponsiveContainer width="100%" aspect={16/9}>
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