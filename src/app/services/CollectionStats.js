"use client";

import { useEffect, useState } from "react";
import styles from "./CollectionStats.module.css";

const calculateCollectionStats = (collection, currency) => {
  let totalCards = 0;
  let totalValue = 0;

  collection.forEach((card) => {
    totalCards += card.quantity;
    const lastPrice = card.priceHistory.length > 0 ? parseFloat(card.priceHistory.at(-1)[currency]) : 0;
    totalValue += lastPrice * card.quantity;
  });

  return { totalCards, totalValue: totalValue.toFixed(2) };
};

export default function CollectionStats({ collection, currency }) {
  const [summary, setSummary] = useState({ totalCards: 0, totalValue: 0 });

  useEffect(() => {
    setSummary(calculateCollectionStats(collection, currency));
  }, [collection, currency]);

  return (
    <div className={styles.collectionStats}>
      <p><strong>Nombre total de cartes :</strong> {summary.totalCards}</p>
      <p><strong>Valeur actuelle :</strong> {summary.totalValue} {currency === "eur" ? "€" : "$"}</p>
    </div>
  );
}