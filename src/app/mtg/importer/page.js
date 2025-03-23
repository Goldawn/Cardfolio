'use client';
import { useEffect, useState } from 'react';
import { fetchSets, fetchSetCards, fetchMoreCards } from '../../services/Scryfall.js';
import Card from '../../components/Card.js';
import Loader from '../../components/Loader.js';
import { addCardToCollection } from "../../services/Collection.js";
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

  const formattedCards = cards.length > 0 ?cards.map(formatCard) : [];

  const {
    filteredCards,
    selectedColors,
    toggleColorFilter,
    selectedTypes,
    toggleTypeFilter,
    selectedRarities,
    toggleRarityFilter,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption
  } = useCardFilters(formattedCards);

  // Charger tous les sets
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

  useEffect(() => {console.log(filteredCards)})

  return (
    <div>
      <h1>Magic: The Gathering</h1>

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
          />

          <div id={styles.cardContainer}>
            {(filteredCards || []).map((card, index) => (
              <Card
                key={card.id}
                card={card}
                cardList={filteredCards}
                currentIndex={index}
                hasOtherFace={card.layout !== "normal"}
                onAddToCollection={addCardToCollection}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}