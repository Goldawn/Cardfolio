"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./CollectionChart.module.css";

const generateCollectionValueHistory = (collection, currency) => {
  const historyMap = new Map();

  collection.forEach((card) => {
    card.priceHistory.forEach(({ date, eur, usd }) => {
      const price = currency === "eur" ? parseFloat(eur) : parseFloat(usd);
      const totalValueForCard = price * card.quantity;

      if (!historyMap.has(date)) {
        historyMap.set(date, 0);
      }
      historyMap.set(date, historyMap.get(date) + totalValueForCard);
    });
  });

  return Array.from(historyMap.entries()).map(([date, totalValue]) => ({ date, totalValue: totalValue.toFixed(2) }));
};

export default function CollectionChart({ collection, currency }) {
  const [collectionHistory, setCollectionHistory] = useState([]);

  useEffect(() => {
    setCollectionHistory(generateCollectionValueHistory(collection, currency));
  }, [collection, currency]);

  return (
    <div className={styles.collectionChart}>
      <ResponsiveContainer width="80%" height={300}>
        <LineChart data={collectionHistory}>
          <XAxis dataKey="date" />
          <YAxis domain={[0, Number(collectionHistory.at(-1)?.totalValue) + 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="totalValue" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
