"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { fetchSets, fetchSetCards, fetchMoreCards } from '../services/Scryfall.js';
import { formatCard } from "../services/FormatCard.js";
import useCardFilters from "../hooks/useCardFilters.js";
import { useCurrencyContext } from "@/context/";
import Link from "next/link";
import Card from "../components/Card.js";
import CollectionActionBar from "../components/CollectionActionBar.js";
import { fetchCardPrice } from "../services/pricing.js";
import styles from "./page.module.css";

export default function Collection() {
  const [collection, setCollection] = useState([]);
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState();
  const [selectedSetCards, setSelectedSetCards] = useState([]);
  const [nextPage, setNextPage] = useState();
  const [ hideNotOwned, setHideNotOwned ] = useState(false);
  const { currency } = useCurrencyContext();

const cardsToFilter = selectedSetCards.length === 0
  ? collection
  : selectedSetCards
      .map(card => {
        const formatted = formatCard(card);
        const owned = collection.find(c => c.id === formatted.id);

        return {
          ...formatted,
          quantity: owned?.quantity || 0,
          priceHistory: owned?.priceHistory || [],
          dbId: owned?.dbId,
        };
      })
      .filter(card => !hideNotOwned || card.quantity > 0);

  const { data: session, status } = useSession();
  const userId = session?.user?.id;

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

      // console.log(card.priceHistory)
      let lastPrice = card.priceHistory.length > 0 ? parseFloat(card.priceHistory.at(-1)[currency]) : 0;
      if (isNaN(lastPrice)) {
        console.warn(`Prix invalide pour la carte ${card.name} (${card.id}): ${card.priceHistory.at(-1)[currency]}`);
        lastPrice = 0;
      }
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

  // console.log("Collection stats:", collectionStats);

  useEffect(() => {
    if (!userId) return;
    const fetchCollectionFromAPI = async () => {
      console.log("Fetching collection for user:", userId);
      try {
        const res = await fetch(`/api/users/${userId}/collection`);
        if (!res.ok) throw new Error("Erreur de chargement");

        const data = await res.json();
        console.log("Collection DATA :", data)
        const enrichedCards = await Promise.all(
          data.map(async (item) => {
            const res = await fetch(`https://api.scryfall.com/cards/${item.scryfallId}`);
            const rawCard = await res.json();
            const formattedCard = formatCard(rawCard);
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

  const toggleHideCards = () => {
    setHideNotOwned(!hideNotOwned)
  }

  useEffect(() => { console.log(hideNotOwned)}, [hideNotOwned]);
  
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

  const handleAddToCollection = async (card) => {
    
      const scryfallId = card.id;
      const { usd, eur } = await fetchCardPrice(card.name);
      const lastPrice = eur || usd || 0;
      const currency = eur ? "eur" : "usd";
      const newPriceEntry = {
        date: new Date().toISOString().split("T")[0],
        [currency]: lastPrice,
      };

      try {
        const res = await fetch(`/api/users/${userId}/collection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scryfallId,
            quantity: 1,
            priceHistory: [newPriceEntry],
          }),
      });

      if (res.ok) {
        const createdItem = await res.json();

        // On va chercher les données scryfall complètes
        const scryfallRes = await fetch(`https://api.scryfall.com/cards/${createdItem.scryfallId}`);
        const rawCard = await scryfallRes.json();
        const formattedCard = formatCard(rawCard);

        // On construit la carte enrichie avec dbId, quantité et historique des prix
        const enrichedCard = {
          ...formattedCard,
          quantity: createdItem.quantity,
          priceHistory: createdItem.priceHistory || [],
          dbId: createdItem.id,
        };

        setCollection((prev) => [...prev, enrichedCard]);
      }

      } catch (err) {
        console.error("Erreur handleAddToCollection :", err);
      }
    }
    
  

  if (status === "loading") return <p>Chargement de la session...</p>;
  if (status === "unauthenticated") return <p>Veuillez vous connecter pour accéder à cette page.</p>;

  return (
    <div id={styles.collectionPage}>

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
          {/* <div> */}
            <label htmlFor="hideNotOwned">Hide not owned
              <input type="checkbox" onChange={toggleHideCards} name="hideNotOwned" id="hideNotOwned" checked={hideNotOwned} ></input>
            </label> 
          {/* </div> */}
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
          {sortedAndFilteredCards.map((card, index) => (
            <Card
              key={card.id}
              card={card}
              cardList={sortedAndFilteredCards}
              currentIndex={index}
              showName
              showQuantity
              showPrice
              showAddToCollectionButton
              onAddToCollection={() => handleAddToCollection(card)}
              showDeleteButton
              updateQuantity={updateQuantity}
              onRemove={removeCard}
              currency={currency}
              compareWithCollection={Boolean(selectedSet)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}