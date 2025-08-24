"use client"

import { useEffect, useState } from "react";
import Card from "./Card";
import styles from "./FetchCardInput.module.css"
import { formatCard } from "../services/FormatCard";

export default function FetchCardInput () {

    const [searchInput, setSearchInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [hoveredCardImageByList, setHoveredCardImageByList] = useState({});

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

    const handleHoverCard = (listId, imageUrl) => {
        setHoveredCardImageByList((prev) => ({
        ...prev,
        [listId]: imageUrl,
        }));
    };


    return (
        
    <section className={styles.searchSection}>
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
                  if (image) handleHoverCard(image);
                } catch (e) {
                  console.error("Erreur chargement image hover", e);
                }
              }}
              onMouseLeave={() => handleHoverCard(null)}
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
        <div className={styles.cardResults}>
          {searchResults.map((card, index) => (
            <div key={index} className={styles.cardResultsItem}>
              <Card
                key={card.id}
                card={card}
                currentIndex={index}
                cardList={searchResults}
                modal={true}
                name={true}
                />
                {/* <button onClick={() => handleAddToSpecificWishlist(card)}>Ajouter à la wishlist</button> */}
            </ div>
          ))}
        </div>
      }
    </section>
    )
}