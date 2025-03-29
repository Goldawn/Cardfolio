"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
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
  // const [collection, setCollection] = useState(loadCollection());
  const [collection, setCollection] = useState([]);
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState();
  const [selectedSetCards, setSelectedSetCards] = useState([]);
  const [nextPage, setNextPage] = useState();
  const { currency } = useCurrencyContext();

  const cardsToFilter = selectedSetCards.length === 0
    ? collection
    : selectedSetCards.map(formatCard);

  // const userId = "40bb6e2f-c254-4dbc-bb42-3937243c6975";
  
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  console.log(userId)
  console.log("Session:", session);
  console.log("Status:", status);

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
    if (!userId) return; // ✅ on attend que la session soit prête
  
    const fetchCollectionFromAPI = async () => {
      try {
        const res = await fetch(`/api/users/${userId}/collection`);
        if (!res.ok) throw new Error("Erreur de chargement");
  
        const data = await res.json();
        console.log("Données brutes de la collection : ", data);
  
        const enrichedCards = await Promise.all(
          data.map(async (item) => {
            const res = await fetch(`https://api.scryfall.com/cards/${item.scryfallId}`);
            const rawCard = await res.json();
            const formattedCard = formatCard(rawCard);
            console.log("Carte formatée :", formattedCard);
            return {
              ...formattedCard,
              quantity: item.quantity,
              priceHistory: Array.isArray(item.priceHistory) ? item.priceHistory : [],
              dbId: item.id,
            };
          })
        );
  
        setCollection(enrichedCards);
      } catch (err) {
        console.error("Erreur lors du fetch de la collection enrichie :", err);
      }
    };
  
    fetchCollectionFromAPI();
  }, [userId]);

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

  const updateQuantity = async (cardId, delta) => {
    const card = collection.find((c) => c.id === cardId);
    if (!card || !card.dbId) return;
  
    try {
      const res = await fetch(`/api/users/${userId}/collection`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scryfallId: card.id,
          quantityDelta: delta,
          // Optionnel : ajouter une nouvelle entrée au priceHistory
          // newPriceEntry: { date: "2025-03-27", eur: 1.5 },
        }),
      });
  
      if (res.status === 204) {
        setCollection((prev) => prev.filter((c) => c.id !== cardId));
      } else if (res.ok) {
        const updated = await res.json();
        setCollection((prev) =>
          prev.map((c) =>
            c.id === cardId ? { ...c, quantity: updated.quantity } : c
          )
        );
      } else {
        throw new Error("Erreur lors de la mise à jour");
      }
    } catch (err) {
      console.error("Erreur updateQuantity :", err);
    }
  };

  const removeCard = async (cardId) => {
    const card = collection.find(c => c.id === cardId);
    if (!card || !card.dbId) return;
  
    try {
      const res = await fetch(`/api/users/${userId}/collection`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scryfallId: card.id }),
      });
  
      if (!res.ok) throw new Error("Erreur lors de la suppression");
  
      setCollection(prev => prev.filter(c => c.id !== cardId));
    } catch (err) {
      console.error("Erreur removeCard :", err);
    }
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

  if (status === "loading") return <p>Chargement de la session...</p>;
  if (status === "unauthenticated") return <p>Veuillez vous connecter pour accéder à cette page.</p>;

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
