"use client";

import { useEffect, useState, useMemo, Fragment } from "react";
import { fetchSets, fetchSetCards, fetchMoreCards } from "../../services/Scryfall.js";
import Card from "../../components/Card.js";
import Loader from "../../components/Loader.js";
import { fetchCardPrice } from "../../services/pricing.js";
import { formatCard } from "../../services/FormatCard.js";
import useCardFilters from "../../hooks/useCardFilters.js";
import CollectionActionBar from "../../components/CollectionActionBar.js";
import styles from "./page.module.css";

export default function ImportClient({
  userId,
  initialCollection,
  initialWishlistLists,
}) {
  const [sets, setSets] = useState([]);
  const [filteredSets, setFilteredSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState({
    name: "",
    code: "",
    card_count: 0,
    released_at: "",
    icon_svg_uri: "",
  });

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displaySetList, setDisplaySetList] = useState(false);
  const [nextPage, setNextPage] = useState(undefined);
  const [recentlyAddedToCollection, setRecentlyAddedToCollection] = useState([]);
  const [isReduced, setIsReduced] = useState(false);

  // ✅ listes de wishlist (source de vérité)
  const [wishlistLists, setWishlistLists] = useState(initialWishlistLists || []);

  // ✅ états "collection" simplifiés pour enrichir les cartes
  const [collection, setCollection] = useState(
    (initialCollection || []).map((c) => ({
      scryfallId: c.scryfallId,
      quantity: c.quantity,
      priceHistory: c.priceHistory,
    }))
  );

  // ✅ Agrégation des quantités wishlist par scryfallId (toutes listes confondues)
  const wishlistTotals = useMemo(() => {
    const map = new Map(); // Map<scryfallId, totalQuantity>
    (wishlistLists || []).forEach((list) => {
      (list.items || []).forEach((it) => {
        const prev = map.get(it.scryfallId) || 0;
        map.set(it.scryfallId, prev + (it.quantity || 0));
      });
    });
    return map;
  }, [wishlistLists]);

  // Mise en forme des cartes
  const formattedCards = cards.length > 0 ? cards.map(formatCard) : [];

  const enrichedCards = formattedCards.map((card) => {
    const owned = collection.find((c) => c.scryfallId === card.id);
    const totalWished = wishlistTotals.get(card.id) || 0;
    return {
      ...card,
      quantity: owned?.quantity || 0,
      wishlistQuantity: totalWished,
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
    setSortOrderAsc,
  } = useCardFilters(enrichedCards);

  // ---- Sets Scryfall ----
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
      const parentSets = matchingSets.filter((set) => !set.parent_set_code);
      const subSets = matchingSets.filter((set) => set.parent_set_code);

      parentSets.forEach((parent) => {
        structuredSets.push(parent);
        subSets
          .filter((sub) => sub.parent_set_code === parent.code)
          .forEach((sub) => structuredSets.push(sub));
      });

      subSets
        .filter((sub) => !parentSets.some((parent) => parent.code === sub.parent_set_code))
        .forEach((sub) => structuredSets.push(sub));

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
      if (!selectedSet.code) return;
      setLoading(true);
      const cardsData = await fetchSetCards(selectedSet.code, "en");
      setCards(cardsData.data);
      if (cardsData.has_more) {
        setNextPage(cardsData.next_page);
      } else {
        setNextPage(undefined);
      }
      setLoading(false);
    };
    loadCards();
  }, [selectedSet]);

  useEffect(() => {
    if (!nextPage) return;
    const loadMoreCards = async () => {
      setLoading(true);
      const moreCardsData = await fetchMoreCards(nextPage);
      setCards((prev) => [...prev, ...moreCardsData.data]);
      if (moreCardsData.has_more) {
        setNextPage(moreCardsData.next_page);
      } else {
        setNextPage(undefined);
      }
      setLoading(false);
    };
    loadMoreCards();
  }, [nextPage]);

  // ---- Collection ----
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
      // Vérifie si déjà présent
      const existingRes = await fetch(`/api/users/${userId}/collection`);
      const existingCards = await existingRes.json();
      const alreadyInCollection = existingCards.find((c) => c.scryfallId === scryfallId);

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

        // local
        setCollection((prev) =>
          prev.map((c) =>
            c.scryfallId === scryfallId ? { ...c, quantity: c.quantity + 1 } : c
          )
        );
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

        // local
        setCollection((prev) => [
          ...prev,
          { scryfallId, quantity: 1, priceHistory: [newPriceEntry] },
        ]);
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
          quantityDelta: -1,
        }),
      });

      if (!patchRes.ok && patchRes.status !== 204) {
        throw new Error("Erreur lors de l'annulation");
      }

      setCollection((prev) => {
        const found = prev.find((c) => c.scryfallId === cardToRemove.id);
        if (!found) return prev;
        if (found.quantity <= 1) {
          return prev.filter((c) => c.scryfallId !== cardToRemove.id);
        }
        return prev.map((c) =>
          c.scryfallId === cardToRemove.id ? { ...c, quantity: c.quantity - 1 } : c
        );
      });

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

  // ---- Wishlist (SplitButton dans Card) ----
  const handleAddToWishlist = async (listId, card) => {
    try {
      const res = await fetch(`/api/users/${userId}/wishlist/lists/${listId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scryfallId: card.id,
          quantity: 1,
        }),
      });

      if (!res.ok) throw new Error("Erreur ajout wishlist");

      const updatedItem = await res.json();

      // ✅ MAJ "wishlistLists" (la source de vérité)
      setWishlistLists((prev) =>
        prev.map((list) => {
          if (list.id !== listId) return list;
          const itemIdx = list.items.findIndex((it) => it.scryfallId === card.id);
          if (itemIdx === -1) {
            return {
              ...list,
              items: [...list.items, { id: updatedItem.id, scryfallId: card.id, quantity: 1 }],
            };
          }
          const newItems = [...list.items];
          newItems[itemIdx] = {
            ...newItems[itemIdx],
            quantity: newItems[itemIdx].quantity + 1,
          };
          return { ...list, items: newItems };
        })
      );
    } catch (err) {
      console.error("Erreur handleAddToWishlist :", err);
    }
  };

  const toggleSortOrder = () => setSortOrderAsc((prev) => !prev);

  return (
    <div id={styles.importPage}>
      <h1 id={styles.top}>Magic: The Gathering</h1>

      <div className={styles.inputContainer}>
        <input type="text" placeholder="Recherchez un set..." onChange={handleInputChange} />
        {displaySetList && (
          <ul id={styles.scrollbar}>
            {filteredSets.map((set) => (
              <li
                key={set.code}
                className={set.parent_set_code ? styles.subSet : ""}
                onClick={() => handleSetSelect(set)}
              >
                <img src={set.icon_svg_uri} alt={set.name} />
                <strong className={!set.parent_set_code ? styles.expansion : ""}>
                  {set.name}
                </strong>{" "}
                ({set.code}) ({set.card_count} cartes)
                <i>{set.released_at}</i>
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
                <h2>
                  {selectedSet.name} ({selectedSet.code})
                </h2>
                <p>
                  {selectedSet.card_count} cartes | sortie le {selectedSet.released_at}
                </p>
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
            toggleSortOrder={toggleSortOrder}
          />

          <div id={styles.cardContainer}>
            {sortedAndFilteredCards.map((card, index) => (
              <Fragment key={`${card.id}-${index}`}>
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
                  wishlistLists={wishlistLists}
                  onAddToCollection={() => handleAddToCollection(card)}
                  onAddToWishlist={(listId) => handleAddToWishlist(listId, card)}
                />
              </Fragment>
            ))}
          </div>
        </>
      )}

      {recentlyAddedToCollection.length > 0 && (
        <aside
          className={`${styles.recentlyImportedCards} ${isReduced ? styles.reduced : ""} ${
            recentlyAddedToCollection.length > 0 ? styles.show : ""
          }`}
        >
          <div className={styles.recentlyAddedHeader}>
            <h3>Cartes récemment ajoutées</h3>
            <div className={styles.reduceSection} onClick={() => setIsReduced(!isReduced)}>
              {isReduced ? "⏶" : "⏷"}
            </div>
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
