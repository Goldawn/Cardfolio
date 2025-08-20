"use client";

import { useEffect, useState } from "react";
import styles from "./WishlistSearchSection.module.css";
import Card from "./Card";
import { formatCard } from "../services/FormatCard";

export default function WishlistSearchSection({ userId, wishlistLists, StopAddingToWishlist, wishlistId, onHoverCard, onCardAdded }) {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Suggestions (autocomplete)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchInput.length < 3) return setSuggestions([]);
      try {
        const res = await fetch(`https://api.scryfall.com/cards/autocomplete?q=${searchInput}`);
        const data = await res.json();
        setSuggestions(data.data || []);
      } catch (error) {
        console.error("Erreur chargement suggestions:", error);
      }
    };
    fetchSuggestions();
  }, [searchInput]);

  // Rechercher des cartes complètes (résultats)
  const handleSearch = async (query) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.scryfall.com/cards/search?q=${query}&unique=prints`);//unique prints pour afficher toutes les variations d'une carte - ajouter case à cocher 
      const data = await res.json();
      const formattedResults = data.data.map(formatCard);
      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Erreur chargement résultats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToSpecificWishlist = async (card) => {
    if (!userId || !wishlistId) return;

    try {
      const addRes = await fetch(`/api/users/${userId}/wishlist/lists/${wishlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scryfallId: card.id,
          quantity: 1,
        }),
      });

      if (!addRes.ok) throw new Error("Erreur lors de l'ajout à la wishlist");
      if (onCardAdded) {
        onCardAdded();
      }
      console.log("✅ Carte ajoutée :", card.name);
    } catch (error) {
      console.error("❌ Erreur ajout carte à wishlist :", error);
    }
  };

  return (
    <section className={styles.searchSection}>

      <button className={styles.closeButton} onClick={StopAddingToWishlist}>×</button>
      
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Nom de la carte"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <button onClick={() => handleSearch(searchInput)}>Rechercher</button>
      </div>

      {suggestions.length > 0 && (
        <ul className={styles.suggestionList}>
          {suggestions.map((s, index) => (
            <li
              key={index}
              onMouseEnter={async () => {
                try {
                  const res = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${s}`);
                  const card = await res.json();
                  const formatted = formatCard(card);
                  const image = formatted.image?.small || formatted.image_uris?.small;
                  if (image) onHoverCard(image);
                } catch (e) {
                  console.error("Erreur chargement image hover", e);
                }
              }}
              onMouseLeave={() => onHoverCard(null)}
              onClick={() => {
                setSearchInput(s);
                setSuggestions([]);
                handleSearch(s);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}


      {loading && <p>Chargement des cartes...</p>}

      {searchResults.length > 0 && !loading && 
      <>
        <p>{searchResults.length} resultats</p>
        <div className={styles.cardResults}>
          {searchResults.map((card, index) => (
            <div key={card.id} className={styles.cardResultsItem}>
              <Card
                card={card}
                currentIndex={index}
                cardList={searchResults}
                modal={true}
                name={true}
                />
                <button onClick={() => handleAddToSpecificWishlist(card)}>Ajouter à la wishlist</button>
            </ div>
          ))}
        </div>
      </>
      }
    </section>
  );
}
