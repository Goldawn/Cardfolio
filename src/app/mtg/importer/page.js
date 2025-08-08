'use client';

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { fetchSets, fetchSetCards, fetchMoreCards } from '../../services/Scryfall.js';
import Card from '../../components/Card.js';
import Loader from '../../components/Loader.js';
import { fetchCardPrice } from "../../services/pricing.js";
import { loadCollection, updateQuantity, removeCard } from "../../services/Collection.js";
import { formatCard } from "../../services/FormatCard.js";
import useCardFilters from "../../hooks/useCardFilters.js";
import CollectionActionBar from "../../components/CollectionActionBar.js";
import styles from './page.module.css';

export default function MTGHome() {
  const [sets, setSets] = useState([]);
  const [filteredSets, setFilteredSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState({
    name: '',
    code: '', 
    card_count: 0,
    released_at: '',
    icon_svg_uri: ''
  });
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displaySetList, setDisplaySetList] = useState(false);
  const [nextPage, setNextPage] = useState();
  const [recentlyAddedToCollection, setRecentlyAddedToCollection] = useState([])
  const [ isReduced, setIsReduced] = useState(false)

  const formattedCards = cards.length > 0 ? cards.map(formatCard) : [];

  const [collection, setCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      const [collRes, wishRes] = await Promise.all([
        fetch(`/api/users/${userId}/collection`),
        fetch(`/api/users/${userId}/wishlist/items`)
      ]);

      const collectionData = await collRes.json();
      const wishlistData = await wishRes.json();

      setCollection(collectionData);
      setWishlist(wishlistData.items || []);
    };

    fetchData();
  }, [userId]);

  const enrichedCards = formattedCards.map((card) => {
    const owned = collection.find(c => c.scryfallId === card.id);
    const wished = wishlist.find(w => w.scryfallId === card.id);
    return {
      ...card,
      quantity: owned?.quantity || 0,
      wishlistQuantity: wished?.quantity || 0
    };
  });

  const {
    sortedAndFilteredCards,
    selectedColors,
    toggleColorFilter,
    selectedTypes,
    toggleTypeFilter,
    selectedRarities,
    toggleRarityFilter,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    sortOrderAsc,
    setSortOrderAsc
  } = useCardFilters(enrichedCards);

  useEffect(() => {
    const loadSets = async () => {
      const allSets = await fetchSets();
      setSets(allSets);
    };
    loadSets();
  }, []);

  const handleInputChange = (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length > 2) {
      const matchingSets = sets.filter((set) => set.name.toLowerCase().includes(query));

      const structuredSets = [];
      const parentSets = matchingSets.filter(set => !set.parent_set_code);
      const subSets = matchingSets.filter(set => set.parent_set_code);

      parentSets.forEach(parent => {
        structuredSets.push(parent);
        subSets.filter(sub => sub.parent_set_code === parent.code).forEach(sub => structuredSets.push(sub));
      });

      subSets.filter(sub => !parentSets.some(parent => parent.code === sub.parent_set_code))
        .forEach(sub => structuredSets.push(sub));

      setFilteredSets(structuredSets);
    }
    setDisplaySetList(false);
  };

  useEffect(() => {
    setDisplaySetList(filteredSets.length > 0);
  }, [filteredSets]);

  const handleSetSelect = async (set) => {
    setSelectedSet({ ...set });
    setDisplaySetList(false);
  };

  useEffect(() => {
    const loadCards = async () => {
      setLoading(true);
      const cardsData = await fetchSetCards(selectedSet.code, 'en');
      setCards(cardsData.data);
      if (cardsData.has_more) {
        setNextPage(cardsData.next_page);
      }
      setLoading(false);
    };
    if (selectedSet.code) loadCards();
  }, [selectedSet]);

  useEffect(() => {
    if (nextPage) {
      const loadMoreCards = async () => {
        setLoading(true);
        const moreCardsData = await fetchMoreCards(nextPage);
        setCards([...cards, ...moreCardsData.data]);
        if (moreCardsData.has_more) {
          setNextPage(moreCardsData.next_page);
        }
        setLoading(false);
      };
      loadMoreCards();
    }
  }, [nextPage]);

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
      const existingRes = await fetch(`/api/users/${userId}/collection`);
      const existingCards = await existingRes.json();
      const alreadyInCollection = existingCards.find(c => c.scryfallId === scryfallId);
  
      if (alreadyInCollection) {
        const patchRes = await fetch(`/api/users/${userId}/collection`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scryfallId,
            quantityDelta: 1,
            newPriceEntry,
          }),
        });
  
        if (!patchRes.ok) throw new Error("Erreur mise à jour quantité");
      } else {
        const postRes = await fetch(`/api/users/${userId}/collection`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scryfallId,
            quantity: 1,
            priceHistory: [newPriceEntry],
          }),
        });
  
        if (!postRes.ok) throw new Error("Erreur ajout nouvelle carte");
      }

      setRecentlyAddedToCollection((prev) => [
        { ...card, addedAt: new Date().toISOString() },
        ...prev,
      ]);
    } catch (err) {
      console.error("Erreur handleAddToCollection :", err);
    }
  };
 
  const handleUndoAdd = async (cardToRemove) => {
  
    try {
      const patchRes = await fetch(`/api/users/${userId}/collection`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scryfallId: cardToRemove.id,
          quantityDelta: -1
        }),
      });
  
      if (!patchRes.ok && patchRes.status !== 204) {
        throw new Error("Erreur lors de l'annulation");
      }
  
      setRecentlyAddedToCollection((prev) => {
        const index = prev.findIndex((c) => c.id === cardToRemove.id);
        if (index !== -1) {
          const updated = [...prev];
          updated.splice(index, 1);
          return updated;
        }
        return prev;
      });
    } catch (error) {
      console.error("Erreur handleUndoAdd :", error);
    }
  };

  if (status === "loading") return <p>Chargement de la session...</p>;
  if (status === "unauthenticated") return <p>Veuillez vous connecter pour accéder à cette page.</p>;

  return (
    <div id={styles.importPage}>
      <h1 id={styles.top} >Magic: The Gathering</h1>

      {/* <div className={styles.backToTop}><a href="#top">&#x2b06;</a></div> */}

      <div className={styles.inputContainer}>
        <input type="text" placeholder="Recherchez un set..." onChange={handleInputChange} />
        {displaySetList && (
          <ul id={styles.scrollbar}>
            {filteredSets.map((set) => (
              <li key={set.code} className={set.parent_set_code ? styles.subSet : ''} onClick={() => handleSetSelect(set)}>
                <img src={set.icon_svg_uri} alt={set.name} />
                <strong className={!set.parent_set_code ? styles.expansion : ""}>{set.name}</strong> ({set.code}) ({set.card_count} cartes)<i>{set.released_at}</i>
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading && <Loader />}

      {selectedSet.name && (
        <>
          <div className={styles.setHeaderInputContainer}>
            <div className={styles.setHeader}>
              <img className={styles.setIcon} src={selectedSet.icon_svg_uri} alt={selectedSet.name} />
              <div className={styles.setDetails}>
                <h2>{selectedSet.name} ({selectedSet.code})</h2>
                <p>{selectedSet.card_count} cartes | sortie le {selectedSet.released_at}</p>
              </div>
            </div>

            <input
              type="text"
              placeholder="Rechercher une carte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

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
            toggleSortOrder={() => setSortOrderAsc((prev) => !prev)}
          />

          <div id={styles.cardContainer}>
            {sortedAndFilteredCards.map((card, index) => (
              <Card
                key={card.id}
                card={card}
                cardList={sortedAndFilteredCards}
                currentIndex={index}
                showName
                showQuantity
                showWishlistQuantity
                showAddToCollectionButton
                showAddToWishlistButton
                onAddToCollection={() => handleAddToCollection(card)}
                onAddToWishlist={() => console.log("Ajout à la wishlist à faire")}
              />
            ))}
          </div>
        </>
      )}

      {recentlyAddedToCollection.length > 0 && (
        <aside
        className={`${styles.recentlyImportedCards} ${isReduced? styles.reduced : "" } ${
          recentlyAddedToCollection.length > 0 ? styles.show : ''
        }`}
        >
          <div className={styles.recentlyAddedHeader}>
            <h3>Cartes récemment ajoutées</h3>
            <div className={styles.reduceSection} onClick={() => setIsReduced(!isReduced)}>{isReduced ? "⏶" : "⏷"}</div>
          </div>
          <div className={styles.cardContainer}>
          {recentlyAddedToCollection.map((card, index) => (
            <Card
              key={`${card.id}-${index}`}
              card={card}
              cardList={recentlyAddedToCollection}
              currentIndex={index}
              hasOtherFace={card.layout !== "normal"}
              className={index === 0 ? styles.cardAppear : ""}
              name={false}
              modal={false}
              undoAddToCollection={() => handleUndoAdd(card)}
            />
          ))}
          </div>
      </aside>
      )}
    </div>
  );
}