"use client";

import { useEffect, useState, useMemo } from "react";
import { loadCollection, saveCollection } from "../services/Collection.js";
import { fetchSets, fetchSetCards, fetchMoreCards } from '../services/Scryfall.js';
import { formatCard } from "../services/FormatCard.js";
import useCardFilters from "../hooks/useCardFilters.js";
import { useCurrencyContext } from "@/context/";
import Link from "next/link";
import Card from "../components/Card.js";
import CollectionActionBar from "../components/CollectionActionBar.js";
import styles from "./page.module.css";

export default function Collection() {
  const [collection, setCollection] = useState(loadCollection());
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState();
  const [selectedSetCards, setSelectedSetCards] = useState([]);
  const [nextPage, setNextPage] = useState();
  const { currency } = useCurrencyContext();

  const cardsToFilter = selectedSetCards.length === 0
    ? collection
    : selectedSetCards.map(formatCard);

  const {
    sortOption,
    setSortOption,
    sortOrderAsc,
    setSortOrderAsc,
    searchQuery,
    setSearchQuery,
    selectedColors,
    toggleColorFilter,
    selectedTypes,
    toggleTypeFilter,
    selectedRarities,
    toggleRarityFilter,
    sortedAndFilteredCards,
  } = useCardFilters(cardsToFilter);

  const collectionStats = useMemo(() => {
    let totalCards = 0;
    let totalValue = 0;
    const uniqueSets = new Set();
    const cardsPerSet = {};
    const uniqueCardsPerSet = {};

    collection.forEach((card) => {
      totalCards += card.quantity;
      uniqueSets.add(card.setCode);

      if (!cardsPerSet[card.setCode]) {
        cardsPerSet[card.setCode] = 0;
      }
      cardsPerSet[card.setCode] += card.quantity;

      if (!uniqueCardsPerSet[card.setCode]) {
        uniqueCardsPerSet[card.setCode] = new Set();
      }
      uniqueCardsPerSet[card.setCode].add(card.id);

      const lastPrice = card.priceHistory.length > 0 ? parseFloat(card.priceHistory.at(-1)[currency]) : 0;
      totalValue += lastPrice * card.quantity;
    });

    const uniqueCardsPerSetCounts = {};
    for (const [setCode, idSet] of Object.entries(uniqueCardsPerSet)) {
      uniqueCardsPerSetCounts[setCode] = idSet.size;
    }

    return {
      totalCards,
      totalSets: uniqueSets.size,
      totalSetsCodes: [...uniqueSets],
      totalValue: totalValue.toFixed(2),
      cardsPerSet,
      uniqueCardsPerSet: uniqueCardsPerSetCounts,
    };
  }, [collection, currency]);

  useEffect(() => {
    const loadSets = async () => {
      const allSets = await fetchSets();
      setSets(allSets);
    };
    loadSets();
  }, []);

  useEffect(() => {
    if (selectedSet) {
      const loadCards = async () => {
        const cardsData = await fetchSetCards(selectedSet, 'en');
        setSelectedSetCards(cardsData.data);
        if (cardsData.has_more) {
          setNextPage(cardsData.next_page);
        }
      };
      loadCards();
    }
  }, [selectedSet]);

  useEffect(() => {
    if (nextPage) {
      const loadMoreCards = async () => {
        const moreCardsData = await fetchMoreCards(nextPage);
        setSelectedSetCards((prev) => [...prev, ...moreCardsData.data]);
        if (moreCardsData.has_more) {
          setNextPage(moreCardsData.next_page);
        }
      };
      loadMoreCards();
    }
  }, [nextPage]);

  const updateQuantity = (cardId, delta) => {
    const updatedCollection = collection.map((card) =>
      card.id === cardId ? { ...card, quantity: Math.max(1, card.quantity + delta) } : card
    );
    setCollection(updatedCollection);
    saveCollection(updatedCollection);
  };

  const removeCard = (cardId) => {
    const updatedCollection = collection.filter((card) => card.id !== cardId);
    setCollection(updatedCollection);
    saveCollection(updatedCollection);
  };

  const getSetName = (setCode) => sets.find((set) => set.code === setCode)?.name || "Nom inconnu";
  const getSetIcon = (setCode) => sets.find((set) => set.code === setCode)?.icon_svg_uri || "";
  const getSetTotalCards = (setCode) => sets.find((set) => set.code === setCode)?.card_count || null;

  const handleSelectedSet = (setCode) => {
    if (selectedSet === setCode) {
      setSelectedSet();
      setSelectedSetCards([]);
    } else {
      setSelectedSet(setCode);
    }
  };

  return (
    <div id={styles.collectionPage}>
      <div className={styles.cardManager}>
        <ul>
          <li>Collection</li>
          <li>Decklists</li>
          <li>Wishlist</li>
          <li>Statistiques</li>
        </ul>
      </div>

      <Link className={styles.addCardsBtn} href="/mtg/importer">
        Importer de nouvelles cartes
      </Link>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Rechercher une carte..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
        />
      </div>

      <div className={styles.collectionContainer}>
        <p className={styles.collectionStats}>
          <span><strong>{collectionStats.totalCards}</strong> Cartes</span>
          <span><strong>{collectionStats.totalSets}</strong> Extensions</span>
          <span><strong>{collectionStats.totalValue}</strong> {currency}</span>
          <span>Voir plus</span>
        </p>

        {collection && (
          <div className={styles.setsContainer}>
            {collectionStats.totalSetsCodes.map((setCode, index) => (
              <div
                className={`${styles.setNames} ${selectedSet === setCode ? styles.active : ""}`}
                key={index}
                onClick={() => handleSelectedSet(setCode)}
              >
                {getSetIcon(setCode) && <img src={getSetIcon(setCode)} alt={getSetName(setCode)} />}
                <p>{getSetName(setCode)}</p>
                <p>{collectionStats.uniqueCardsPerSet[setCode]}/{getSetTotalCards(setCode)}</p>
              </div>
            ))}
          </div>
        )}

        <CollectionActionBar
          selectedColors={selectedColors}
          toggleColorFilter={toggleColorFilter}
          selectedTypes={selectedTypes}
          toggleTypeFilter={toggleTypeFilter}
          selectedRarities={selectedRarities}
          toggleRarityFilter={toggleRarityFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          sortOrderAsc={sortOrderAsc}
          toggleSortOrder={() => setSortOrderAsc(prev => !prev)}
        />

        <div className={styles.cardContainer}>
          {sortedAndFilteredCards.map((card, index) => {
            const isOwned = collection.some((ownedCard) => ownedCard.id === card.id);
            return (
              <Card
                key={card.id}
                card={card}
                owned={isOwned}
                cardList={sortedAndFilteredCards}
                currentIndex={index}
                updateQuantity={updateQuantity}
                onRemove={removeCard}
                currency={currency}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
