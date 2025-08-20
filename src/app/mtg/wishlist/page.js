"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import WishlistSearchSection from "../../components/WishlistSearchSection";
import MagicCardPlaceholder from "../../components/MagicCardPlaceholder";
import WishlistList from "../../components/WishlistList";
import Card from "../../components/Card";
import { formatCard } from "../../services/FormatCard";
import styles from "./page.module.css";

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const [lists, setLists] = useState([]);
  const [cardsByList, setCardsByList] = useState({});
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState("");
  const [activeListId, setActiveListId] = useState(null);
  const [hoveredCardImageByList, setHoveredCardImageByList] = useState({});

  const userId = session?.user?.id;

  const fetchWishlistLists = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/users/${userId}/wishlist/lists`);
      const data = await res.json();
      setLists(data);
    } catch (error) {
      console.error("Erreur chargement listes de souhait :", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchWishlistLists();
    }
  }, [userId, status]);

  useEffect(() => {
    console.log(lists)
    const fetchAllCards = async () => {
      if (!userId || lists.length === 0) return;

      const allCards = {};

      await Promise.all(
        lists.map(async (list) => {
          try {
            const res = await fetch(`/api/users/${userId}/wishlist/lists/${list.id}/items`);
            const items = await res.json();

            const enriched = await Promise.all(
              items.map(async (item) => {
                const res = await fetch(`https://api.scryfall.com/cards/${item.scryfallId}`);
                const raw = await res.json();
                const formatted = formatCard(raw);
                return {
                  ...formatted,
                  wishlistQuantity: item.quantity,
                  wishlistItemId: item.id,
                };
              })
            );

            allCards[list.id] = enriched;
          } catch (error) {
            console.error(`Erreur chargement cartes de la liste ${list.name} :`, error);
            allCards[list.id] = [];
          }
        })
      );

      setCardsByList(allCards);
    };

    fetchAllCards();
  }, [lists, userId]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      const res = await fetch(`/api/users/${userId}/wishlist/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName }),
      });
      const createdList = await res.json();
      setLists((prev) => [createdList, ...prev]);
      setNewListName("");
    } catch (error) {
      console.error("❌ Erreur création liste :", error);
    }
  };

  const handleRenameList = async (listId, newName) => {
    try {
      const res = await fetch(`/api/users/${userId}/wishlist/lists`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId, name: newName }),
      });

      const updated = await res.json();
      setLists((prev) =>
        prev.map((list) =>
          list.id === listId ? { ...list, name: updated.name } : list
        )
      );
    } catch (err) {
      console.error("Erreur renommage liste :", err);
    }
  };

  const handleDeleteList = async (listId) => {
    if (!confirm("Supprimer cette liste ?")) return;
    try {
      await fetch(`/api/users/${userId}/wishlist/lists`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId }),
      });
      setLists((prev) => prev.filter((list) => list.id !== listId));
    } catch (err) {
      console.error("Erreur suppression liste :", err);
    }
  };

  const handleOpenAddCard = (listId) => {
    setActiveListId(listId);
  };

  const handleCloseAddCard = () => {
    setActiveListId(null);
    setHoveredCardImageByList({});
  };

  const handleHoverCard = (listId, imageUrl) => {
    setHoveredCardImageByList((prev) => ({
      ...prev,
      [listId]: imageUrl,
    }));
  };

  const removeCard = async (wishlistId, cardId) => {
    if (!cardId, !wishlistId) return;

    try {
      const res = await fetch(`/api/users/${userId}/wishlist/lists/${wishlistId}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scryfallId: cardId }),
      });

      if (!res.ok) throw new Error("Erreur lors de la suppression");

      fetchWishlistLists();
    } catch (err) {
      console.error("Erreur removeCard :", err);
    }
  };

  // doublon avec les fonctions sur les autres pages
  const updateQuantity = async (wishlistId, cardId, delta) => {
    if (!cardId || !wishlistId) return;
    try {
      const res = await fetch(`/api/users/${userId}/wishlist/lists/${wishlistId}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scryfallId: cardId,
          quantityDelta: delta,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la modification");

      fetchWishlistLists();
    } catch (err) {
      console.error("Erreur updateQuantity :", err);
    }
  };

  const handleTestRoute = async () => {
    console.log("TEST DE LA ROUTE");
    try {
      const res = await fetch(`/api/users/${userId}/card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scryfallIds: ["b6c129a7-59d3-499e-8279-f374266150be"],
        }),
      });
      const data = await res.json();
      console.log(data)
    } catch (error) {
      console.error("Erreur updateQuantity :", error);
    }
  }

  if (status === "loading") return <p>Chargement de la session...</p>;
  if (status === "unauthenticated") return <p>Veuillez vous connecter.</p>;

  return (
    <div className={styles.wishlistPage}>

      <h1>Ma Wishlist</h1>

      <button onClick={handleTestRoute}>TEST DE LA ROUTE</button>

      <div className={styles.newListForm}>
        <input
          type="text"
          placeholder="Nom de la nouvelle liste"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
        />
        <button onClick={handleCreateList}>➕ Créer la liste</button>
      </div>

      {loading && <p>Chargement des listes...</p>}
      {!loading && lists.length === 0 && <p>Aucune liste pour le moment.</p>}

      {!loading && lists.length > 0 && (
        <div className={styles.listsContainer}>

          {lists.map((list) => (
            <div key={list.id} className={styles.wishlistSection}>
              <WishlistList
                list={list}
                userId={userId}
                onRename={(newName) => handleRenameList(list.id, newName)}
                onDelete={() => handleDeleteList(list.id)}
              />
              <div className={styles.cardGrid}>
                {(cardsByList[list.id] || []).map((card, index) => (
                  <Card
                    key={card.id}
                    listId={list.id}
                    card={card}
                    currentIndex={index}
                    cardList={cardsByList[list.id]}
                    name={true}
                    modal={true}
                    // showQuantity
                    showWishlistQuantity
                    showDeleteButton
                    onRemove={(cardId) => removeCard(list.id, cardId)}
                    editableQuantity
                    updateQuantity={(cardId, delta) => updateQuantity(list.id, cardId, delta)}
                  />
                ))}

                <div className={`${styles.addCardToWishlist} ${activeListId === list.id ? styles.active : ""}`}>
                  <MagicCardPlaceholder
                    test={() => handleOpenAddCard(list.id)}
                    image={hoveredCardImageByList[list.id]}
                  />

                  {activeListId === list.id && (
                    <WishlistSearchSection
                      userId={userId}
                      wishlistLists={lists}
                      StopAddingToWishlist={handleCloseAddCard}
                      wishlistId={list.id}
                      onHoverCard={(imageUrl) => handleHoverCard(list.id, imageUrl)}
                      onCardAdded={fetchWishlistLists}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}

        </div>
      )}

    </div>
  );
}
