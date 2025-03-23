import { useState, useEffect, useMemo } from 'react';

export default function useCardFilters(cards = []) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedRarities, setSelectedRarities] = useState([]);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleColorFilter = (color) => {
    setSelectedColors((prevColors) =>
      prevColors.includes(color)
        ? prevColors.filter((c) => c !== color)
        : [...prevColors, color]
    );
  };

  const toggleTypeFilter = (type) => {
    setSelectedTypes((prevTypes) =>
      prevTypes.includes(type)
        ? prevTypes.filter((t) => t !== type)
        : [...prevTypes, type]
    );
  };

  const toggleRarityFilter = (rarity) => {
    setSelectedRarities((prevRarities) =>
      prevRarities.includes(rarity)
        ? prevRarities.filter((r) => r !== rarity)
        : [...prevRarities, rarity]
    );
  };

  const filterCards = (cardList) => {
    return cardList.filter((card) => {
      const matchesSearch = card.name.toLowerCase().includes(debouncedSearchQuery);
      const matchesColor =
        selectedColors.length === 0 ||
        card.colors?.some((color) => selectedColors.includes(color)) ||
        (selectedColors.includes("C") && card.colors?.length === 0) ||
        (selectedColors.includes("M") && card.colors?.length > 1);

      const matchesType =
        selectedTypes.length === 0 ||
        selectedTypes.some((type) => card.type?.includes(type));

      const matchesRarity =
        selectedRarities.length === 0 ||
        selectedRarities.includes(card.rarity?.toLowerCase());

      return matchesSearch && matchesColor && matchesType && matchesRarity;
    });
  };

  const filteredCards = useMemo(() => filterCards(cards), [cards, debouncedSearchQuery, selectedColors, selectedTypes, selectedRarities]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    selectedColors,
    toggleColorFilter,
    selectedTypes,
    toggleTypeFilter,
    selectedRarities,
    toggleRarityFilter,
    filteredCards,
    filterCards
  };
}
