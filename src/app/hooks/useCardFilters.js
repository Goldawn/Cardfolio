import { useState, useEffect, useMemo } from 'react';

export default function useCardFilters(cards = []) {
  const [sortOption, setSortOption] = useState("name");
  const [sortOrderAsc, setSortOrderAsc] = useState(true);
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
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleTypeFilter = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleRarityFilter = (rarity) => {
    setSelectedRarities((prev) =>
      prev.includes(rarity) ? prev.filter((r) => r !== rarity) : [...prev, rarity]
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

  const sortCards = (cardsToSort) => {
    return [...cardsToSort].sort((a, b) => {
      let result = 0;
      switch (sortOption) {
        case "price":
          result = parseFloat(a.priceHistory?.at(-1)?.eur || 0) - parseFloat(b.priceHistory?.at(-1)?.eur || 0);
          break;
        case "name":
          result = a.name.localeCompare(b.name);
          break;
        case "date":
          result = new Date(a.addedAt) - new Date(b.addedAt);
          break;
        case "set":
          result = a.setCode.localeCompare(b.setCode);
          break;
        case "color":
          result = (a.colors?.[0] || "").localeCompare(b.colors?.[0] || "");
          break;
        case "rarity":
          const order = { mythic: 4, rare: 3, uncommon: 2, common: 1 };
          result = (order[a.rarity?.toLowerCase()] || 0) - (order[b.rarity?.toLowerCase()] || 0);
          break;
        default:
          break;
      }
      return sortOrderAsc ? result : -result;
    });
  };

  const sortedAndFilteredCards = useMemo(() => {
    const filtered = filterCards(cards);
    return sortCards(filtered);
  }, [cards, debouncedSearchQuery, selectedColors, selectedTypes, selectedRarities, sortOption, sortOrderAsc]);

  return {
    sortOption,
    setSortOption,
    sortOrderAsc,
    setSortOrderAsc,
    searchQuery,
    setSearchQuery,
    selectedColors,
    toggleColorFilter,
    selectedTypes,
    toggleTypeFilter,
    selectedRarities,
    toggleRarityFilter,
    sortedAndFilteredCards,
  };
}