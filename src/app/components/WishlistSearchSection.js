"use client";

import { useEffect, useState } from "react";
import styles from "./WishlistSearchSection.module.css";
import Card from "./Card";
import { formatCard } from "../services/FormatCard";

export default function WishlistSearchSection({userId}) {
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
      const res = await fetch(`https://api.scryfall.com/cards/search?q=${query}`);
      const data = await res.json();
      const formattedResults = data.data.map(formatCard);
      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Erreur chargement résultats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToDefaultWishlist = async (card) => {
    if (!userId) return;
  
    try {
      // 1. Vérifie s'il existe déjà une liste
      const resLists = await fetch(`/api/users/${userId}/wishlist/lists`);
      let lists = await resLists.json();
  
      let defaultList = lists[0];
  
      // 2. S’il n’y a aucune liste, en créer une par défaut
      if (!defaultList) {
        const createRes = await fetch(`/api/users/${userId}/wishlist/lists`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Wishlist principale" }),
        });
  
        defaultList = await createRes.json();
        console.log("✅ Liste par défaut créée :", defaultList);
      }
  
      // 3. Ajouter la carte à la liste
      const addRes = await fetch(`/api/users/${userId}/wishlist/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scryfallId: card.id,
          quantity: 1,
          wishlistId: defaultList.id,
        }),
      });
  
      if (!addRes.ok) throw new Error("Erreur lors de l'ajout à la wishlist");
  
      console.log("✅ Carte ajoutée :", card.name);
    } catch (error) {
      console.error("❌ Erreur ajout carte à wishlist :", error);
    }
  };

  return (
    <section className={styles.searchSection}>
      <h2>Rechercher une carte</h2>

      <input
        type="text"
        placeholder="Nom de la carte"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      {suggestions.length > 0 && (
        <ul className={styles.suggestionList}>
          {suggestions.map((s, index) => (
            <li key={index} onClick={() => {
              setSearchInput(s);
              setSuggestions([]);
              handleSearch(s);
            }}>
              {s}
            </li>
          ))}
        </ul>
      )}

      <button onClick={() => handleSearch(searchInput)}>Rechercher</button>

      {loading && <p>Chargement des cartes...</p>}

      <div className={styles.cardResults}>
        {searchResults.map((card, index) => (
          <div className={styles.cardResultsItem}>
          <Card
            key={card.id}
            card={card}
            currentIndex={index}
            cardList={searchResults}
            modal={true}
            name={true}
            />
            <button onClick={() => handleAddToDefaultWishlist(card)}>Ajouter à la wishlist</button>
            </ div>
        ))}
      </div>
    </section>
  );
}
