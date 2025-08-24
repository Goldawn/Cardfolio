"use client";

import { useEffect, useState, useMemo, Fragment, useTransition } from "react";
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
  actions, // { addToCollection, undoAddToCollection, addToWishlist, removeFromCollection }
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
  // const [recentlyAddedToCollection, setRecentlyAddedToCollection] = useState([]);

  // [{ id: scryfallId, card, count }]
 const [recentlyAdded, setRecentlyAdded] = useState([]);

  const [isReduced, setIsReduced] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ✅ wishlists (source de vérité)
  const [wishlistLists, setWishlistLists] = useState(initialWishlistLists || []);

  // ✅ état collection local (simplifié)
  const [collection, setCollection] = useState(
    (initialCollection || []).map((c) => ({
      scryfallId: c.scryfallId,
      quantity: c.quantity,
      priceHistory: c.priceHistory,
    }))
  );

  // ✅ totaux wishlist par scryfallId (toutes listes)
  const wishlistTotals = useMemo(() => {
    const map = new Map();
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

  const handleSetSelect = (set) => {
    setSelectedSet({ ...set });
    setDisplaySetList(false);
  };

  useEffect(() => {
    const loadCards = async () => {
      if (!selectedSet.code) return;
      setLoading(true);
      try {
        const cardsData = await fetchSetCards(selectedSet.code, "en");
        setCards(cardsData.data);
        if (cardsData.has_more) setNextPage(cardsData.next_page);
        else setNextPage(undefined);
      } finally {
        setLoading(false);
      }
    };
    loadCards();
  }, [selectedSet]);

  useEffect(() => {
    if (!nextPage) return;
    const loadMoreCards = async () => {
      setLoading(true);
      try {
        const moreCardsData = await fetchMoreCards(nextPage);
        setCards((prev) => [...prev, ...moreCardsData.data]);
        if (moreCardsData.has_more) setNextPage(moreCardsData.next_page);
        else setNextPage(undefined);
      } finally {
        setLoading(false);
      }
    };
    loadMoreCards();
  }, [nextPage]);

const bumpRecent = (card, delta) => {
  if (!card?.id || !delta) return;
  setRecentlyAdded((prev) => {
    const idx = prev.findIndex((e) => e.id === card.id);
    if (delta > 0) {
      if (idx === -1) {
        return [{ id: card.id, card, count: delta }, ...prev];
      }
      const copy = [...prev];
      copy[idx] = { ...copy[idx], count: copy[idx].count + delta };
      return copy;
    } else {
      if (idx === -1) return prev;
      const nextCount = prev[idx].count + delta;
      if (nextCount <= 0) {
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      }
      const copy = [...prev];
      copy[idx] = { ...copy[idx], count: nextCount };
      return copy;
    }
  });
};

const handleRecentCardClick = (cardId) => {
  const cardObj = formattedCards.find((c) => c.id === cardId) || { id: cardId };
  startTransition(async () => {
    try {
      const result = await actions.updateCollectionQuantity(cardId, -1);
      if (!result) return;

      if (result.kind === "deleted") {
        setCollection((prev) => prev.filter((c) => c.scryfallId !== cardId));
      } else if (result.kind === "updated" && result.item) {
        setCollection((prev) =>
          prev.map((c) =>
            c.scryfallId === cardId ? { ...c, quantity: result.item.quantity } : c
          )
        );
      }

      // décrémente le compteur “récemment ajouté”
      bumpRecent(cardObj, -1);
    } catch (err) {
      console.error("Erreur recent click (-1) :", err);
    }
  });
};



  // ---- Collection (Server Actions) ----
  const handleAddToCollection = (card) => {
    const scryfallId = card.id;

    startTransition(async () => {
      try {
        const { usd, eur } = await fetchCardPrice(card.name);
        const lastPrice = eur || usd || 0;
        const currency = eur ? "eur" : "usd";
        const newPriceEntry = {
          date: new Date().toISOString().split("T")[0],
          [currency]: lastPrice,
        };

        const result = await actions.addToCollection(scryfallId, newPriceEntry);
        const { item } = result || {};
        if (!item) return;

        setCollection((prev) => {
          const idx = prev.findIndex((c) => c.scryfallId === scryfallId);
          if (idx === -1) {
            return [
              ...prev,
              { scryfallId, quantity: item.quantity, priceHistory: item.priceHistory || [newPriceEntry] },
            ];
          }
          const copy = [...prev];
          copy[idx] = {
            ...copy[idx],
            quantity: item.quantity,
            priceHistory: item.priceHistory || copy[idx].priceHistory,
          };
          return copy;
        });

        bumpRecent(card, 1);

      } catch (err) {
        console.error("Erreur addToCollection (server action) :", err);
      }
    });
  };

  // const handleUndoAdd = (cardToRemove) => {
  //   startTransition(async () => {
  //     try {
  //       const result = await actions.undoAddToCollection(cardToRemove.id);
  //       console.log("Undo result:", result);
  //       if (result?.kind === "deleted") {
  //         setCollection((prev) => prev.filter((c) => c.scryfallId !== cardToRemove.id));
  //       } else if (result?.kind === "updated" && result.item) {
  //         setCollection((prev) =>
  //           prev.map((c) =>
  //             c.scryfallId === cardToRemove.id ? { ...c, quantity: result.item.quantity } : c
  //           )
  //         );
  //       }
  //       setRecentlyAddedToCollection((prev) => prev.filter((c) => c.id !== cardToRemove.id));
  //     } catch (err) {
  //       console.error("Erreur undoAdd (server action) :", err);
  //     }
  //   });
  // };

    // ---- Met à jour la quantité d'une carte dans la collection (Server Action) ----
  const handleUpdateQuantity = (cardId, delta) => {
  startTransition(async () => {
    try {
      const result = await actions.updateCollectionQuantity(cardId, delta);
      if (!result) return;

      if (result.kind === "deleted") {
        setCollection((prev) => prev.filter((c) => c.scryfallId !== cardId));
        setRecentlyAdded((prev) => prev.filter((e) => e.id !== cardId));
        return;
      }

      if (result.kind === "updated" && result.item) {
        setCollection((prev) => {
          const idx = prev.findIndex((c) => c.scryfallId === cardId);
          if (idx === -1) {
            // si on n'avait pas l'item localement (cas delta > 0 sur item inexistant)
            return [...prev, { scryfallId: cardId, quantity: result.item.quantity, priceHistory: [] }];
          }
          const copy = [...prev];
          copy[idx] = { ...copy[idx], quantity: result.item.quantity };
          return copy;
        });
      }

      // si on ajoute, on incrémente le compteur "récemment ajouté"
     const cardObj = formattedCards.find((c) => c.id === cardId) || { id: cardId };
     if (delta > 0) {
       bumpRecent(cardObj, delta);
     } else if (delta < 0) {
       bumpRecent(cardObj, delta);
     }
    } catch (err) {
      console.error("Erreur updateCollectionQuantity (server action) :", err);
    }
  });
};

  // ---- Wishlist (Server Action) ----
  const handleAddToWishlist = (listId, card) => {
    if (!listId) return; // aucune liste dispo
    startTransition(async () => {
      try {
        const result = await actions.addToWishlist(listId, card.id, 1);
        const { item } = result || {};
        if (!item) return;

        setWishlistLists((prev) =>
          prev.map((list) => {
            if (list.id !== listId) return list;
            const idx = list.items.findIndex((it) => it.scryfallId === card.id);
            if (idx === -1) {
              return {
                ...list,
                items: [...list.items, { id: item.id, scryfallId: card.id, quantity: item.quantity }],
              };
            }
            const newItems = [...list.items];
            newItems[idx] = { ...newItems[idx], quantity: item.quantity };
            return { ...list, items: newItems };
          })
        );
      } catch (err) {
        console.error("Erreur addToWishlist (server action) :", err);
      }
    });
  };

  // --- suppression de tous les exemplaires d'une carte de la collection ---
  const handleRemoveFromCollection = (cardId) => {
    const card = formattedCards.find((c) => c.id === cardId);
    if (!card) return;

    startTransition(async () => {
      try {
        const result = await actions.removeFromCollection(cardId);
        if (result?.kind === "deleted") {
          // ✅ Supprime la carte de la collection
          setCollection((prev) => prev.filter((c) => c.scryfallId !== cardId));
          // ✅ Supprime aussi la carte de l'aside récemment ajouté
          setRecentlyAdded((prev) => prev.filter((e) => e.id !== cardId));
        }
      } catch (err) {
        console.error("Erreur removeFromCollection (server action) :", err);
      }
    });
  };


  const toggleSortOrder = () => setSortOrderAsc((prev) => !prev);

  return (
    <div id={styles.importPage} aria-busy={isPending || loading}>
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
                <strong className={!set.parent_set_code ? styles.expansion : ""}>{set.name}</strong>{" "}
                ({set.code}) ({set.card_count} cartes) <i>{set.released_at}</i>
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
                  showDeleteButton
                  updateQuantity={handleUpdateQuantity}
                  wishlistLists={wishlistLists}
                  onAddToCollection={() => handleAddToCollection(card)}
                  onAddToWishlist={(listId) => handleAddToWishlist(listId, card)}
                  onRemove={handleRemoveFromCollection}
                  disabled={isPending}
                />
              </Fragment>
            ))}
          </div>
        </>
      )}

      {recentlyAdded.length > 0 && (
        <aside
          className={`${styles.recentlyImportedCards} ${isReduced ? styles.reduced : ""} ${
            recentlyAdded.length > 0 ? styles.show : ""
          }`}
        >
          <div className={styles.recentlyAddedHeader}>
            <h3>Cartes récemment ajoutées</h3>
            <div className={styles.reduceSection} onClick={() => setIsReduced(!isReduced)}>
              {isReduced ? "⏶" : "⏷"}
            </div>
          </div>
          <div className={styles.cardContainer}>
            {recentlyAdded.map(({ id, card, count }, index) => (
              <div
                key={`${id}-${index}`}
                onClick={() => handleRecentCardClick(id)}   // 👈 clique = -1
                style={{ cursor: "pointer" }}
              >
                <Card
                  card={card}
                  cardList={recentlyAdded.map((e) => e.card)}
                  currentIndex={index}
                  hasOtherFace={card.layout !== "normal"}
                  className={index === 0 ? styles.cardAppear : ""}
                  name={false}
                  modal={false}
                />
                <p>
                  récemment ajouté : <strong>{count}</strong>
                </p>
              </div>
              ))}
          </div>
        </aside>
      )}
    </div>
  );
}
