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
                  quantity: item.quantity,
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

  if (status === "loading") return <p>Chargement de la session...</p>;
  if (status === "unauthenticated") return <p>Veuillez vous connecter.</p>;

  return (
    <div className={styles.wishlistPage}>
      <h1>Ma Wishlist</h1>

      <WishlistSearchSection userId={userId} wishlistLists={lists} />

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
                onCardAdded={fetchWishlistLists}
              />
              <div className={styles.cardGrid}>
                {(cardsByList[list.id] || []).map((card, index) => (
                  <Card
                    key={card.id}
                    card={card}
                    currentIndex={index}
                    cardList={cardsByList[list.id]}
                    name={true}
                    modal={true}
                  />
                ))}
                <MagicCardPlaceholder/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
