"use client";

import { useState } from 'react';
import manaSymbols from '../assets/mock/mana.json';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './CardModal.module.css';
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

  const isFrontAndBack = currentCard.layout === "flip" || currentCard.layout === "transform" || currentCard.layout === "modal_dfc";
  const isDualCard = currentCard.layout === "split" || currentCard.layout === "adventure";

  const formatPriceHistoryForChart = (priceHistory) => {
    if (!priceHistory || priceHistory.length === 0) return [];
    return priceHistory
      .map(entry => ({
        date: entry.date,
        eur: parseFloat(entry.eur),
        usd: parseFloat(entry.usd),
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const formattedPriceHistory = formatPriceHistoryForChart(currentCard.priceHistory);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        {cardList.length > 1 && (
          <div className={styles.navButtons}>
            <button onClick={handlePreviousCard} disabled={currentCardIndex === 0}>Prev</button>
            <button onClick={handleNextCard} disabled={currentCardIndex === cardList.length - 1}>Next</button>
          </div>
        )}
        <div className={styles.content}>
          <div className={styles.cardQuantityPanel}>
            {isFrontAndBack ? (
              <div className={styles.cardContainer}>
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
              <div className={styles.imageContainer}>
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
            <h2>{flipped ? currentCard.cardBack.name : isDualCard ? currentCard.name.split(" // ")[0] : currentCard.name}</h2>
            {flipped ? currentCard.cardBack.manaCost && <p><strong>Coût de mana :</strong> {formatAndParseText(currentCard.manaCost)}</p>
              : isDualCard ? <p><strong>Coût de mana :</strong>{formatAndParseText(currentCard.manaCost.split(" // ")[0])}</p>
              : currentCard.manaCost && <p><strong>Coût de mana :</strong>{formatAndParseText(currentCard.manaCost)}</p>}
            <p><strong>Type :</strong> {flipped ? currentCard.cardBack.type : isDualCard ? currentCard.type.split(" // ")[0] : currentCard.type}</p>
            <p><strong>Rareté :</strong> {currentCard.rarity}</p>
            <p><strong>Set:</strong>{currentCard.setName} ({currentCard.setCode})</p>
            {flipped ? currentCard.cardBack.power && currentCard.cardBack.toughness && <p><strong>statistiques</strong>{currentCard.cardBack.power}/{currentCard.cardBack.toughness}</p>
              : currentCard.power && currentCard.toughness && <p><strong>statistiques</strong>{currentCard.power}/{currentCard.toughness}</p>}
            {flipped ? currentCard.cardBack.loyalty && <p><strong>Points de loyauté :</strong> {currentCard.cardBack.loyalty}</p>
              : currentCard.loyalty && <p><strong>Points de loyauté :</strong> {currentCard.loyalty}</p>}
            {flipped ? currentCard.cardBack.oracleText && <p><strong>Description :</strong> {formatAndParseText(currentCard.cardBack.oracleText)}</p>
              : currentCard.oracleText && <p><strong>Description :</strong> {formatAndParseText(currentCard.oracleText)}</p>}
            {flipped ? currentCard.cardBack.flavorText && <p><em>{formatAndParseText(currentCard.cardBack.flavorText)}</em></p>
              : currentCard.flavorText && <p><em>{formatAndParseText(currentCard.flavorText)}</em></p>}
            <p><strong>Numéro de collection :</strong> {currentCard.collectorNumber}</p>
            {currentCard.colors?.length > 0 && (
              <p><strong>Couleurs :</strong> {flipped ? currentCard.cardBack.colors.join(", ") : currentCard.colors.join(", ")}</p>
            )}
            {isDualCard &&
              <>
                <p>---------------------------------------------------------</p>
                <h2>{currentCard.cardBack.name}</h2>
                <p><strong>Coût de mana :</strong> {formatAndParseText(currentCard.cardBack.manaCost)}</p>
                <p><strong>Type :</strong>{currentCard.cardBack.type}</p>
                {currentCard.cardBack.power && currentCard.cardBack.toughness && <p><strong>statistiques :</strong>{currentCard.cardBack.power}/{currentCard.cardBack.toughness}</p>}
                {currentCard.cardBack.oracleText && <p><strong>Description :</strong>{formatAndParseText(currentCard.cardBack.oracleText)}</p>}
                {currentCard.cardBack.flavorText && <p><strong>Flavor :</strong>{formatAndParseText(currentCard.cardBack.flavorText)}</p>}
              </>
            }
            <p>---------------------------------------------------------</p>
            <p><strong>Formats légaux :</strong></p>
            <ul className={styles.legalities}>
              {Object.entries(currentCard.legalities)
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
