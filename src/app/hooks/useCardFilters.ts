'use client'

import type { CardRarity, FilterState, GameCard } from '@/types'
import { useEffect, useMemo, useState } from 'react'

export default function useCardFilters(cards: GameCard[] = []) {
  const [filterState, setFilterState] = useState<FilterState>({
    sortOption: 'name',
    sortOrderAsc: true,
    searchQuery: '',
    selectedColors: [],
    selectedTypes: [],
    selectedRarities: [],
    selectedSets: [],
  })
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(filterState.searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [filterState.searchQuery])

  const toggleColorFilter = (color: string): void => {
    setFilterState(prev => ({
      ...prev,
      selectedColors: prev.selectedColors.includes(color)
        ? prev.selectedColors.filter(c => c !== color)
        : [...prev.selectedColors, color],
    }))
  }

  const toggleTypeFilter = (type: string): void => {
    setFilterState(prev => ({
      ...prev,
      selectedTypes: prev.selectedTypes.includes(type)
        ? prev.selectedTypes.filter(t => t !== type)
        : [...prev.selectedTypes, type],
    }))
  }

  const toggleRarityFilter = (rarity: CardRarity): void => {
    setFilterState(prev => ({
      ...prev,
      selectedRarities: prev.selectedRarities.includes(rarity)
        ? prev.selectedRarities.filter(r => r !== rarity)
        : [...prev.selectedRarities, rarity],
    }))
  }

  const filterCards = (cardList: GameCard[]): GameCard[] => {
    return cardList.filter(card => {
      const fieldsToSearch = [
        card.name,
        card.artist,
        // Pour MTG, oracleText est dans gameData
        'oracleText' in card.gameData ? card.gameData.oracleText : undefined,
        // Pour MTG, type est dans gameData
        'type' in card.gameData ? card.gameData.type : undefined,
      ]

      const matchesSearch = fieldsToSearch.some(field =>
        field?.toLowerCase().includes(debouncedSearchQuery)
      )

      const matchesColor =
        filterState.selectedColors.length === 0 ||
        card.colors?.some(color =>
          filterState.selectedColors.includes(color)
        ) ||
        (filterState.selectedColors.includes('C') &&
          card.colors?.length === 0) ||
        (filterState.selectedColors.includes('M') &&
          (card.colors?.length ?? 0) > 1)
      const matchesType =
        filterState.selectedTypes.length === 0 ||
        filterState.selectedTypes.some(type =>
          'type' in card.gameData ? card.gameData.type?.includes(type) : false
        )
      const matchesRarity =
        filterState.selectedRarities.length === 0 ||
        (card.rarity
          ? filterState.selectedRarities.includes(card.rarity)
          : false)
      return matchesSearch && matchesColor && matchesType && matchesRarity
    })
  }

  const sortCards = (cardsToSort: GameCard[]): GameCard[] => {
    return [...cardsToSort].sort((a, b) => {
      let result = 0
      switch (filterState.sortOption) {
        case 'price':
          result =
            parseFloat(String(a.priceHistory?.at(-1)?.eur || 0)) -
            parseFloat(String(b.priceHistory?.at(-1)?.eur || 0))
          break
        case 'name':
          result = (a.name || '').localeCompare(b.name || '')
          break
        case 'date':
          result =
            new Date(a.dateAdded || '').getTime() -
            new Date(b.dateAdded || '').getTime()
          break
        case 'set':
          result = (a.setCode || '').localeCompare(b.setCode || '')
          if (result === 0) {
            // Si les sets sont identiques, on trie par numéro de collection
            result =
              (parseInt(a.collectorNumber || '0') || 0) -
              (parseInt(b.collectorNumber || '0') || 0)
          }
          break
        case 'color':
          result = (a.colors?.[0] || '').localeCompare(b.colors?.[0] || '')
          break
        case 'rarity':
          const order: Record<string, number> = {
            mythic: 4,
            rare: 3,
            uncommon: 2,
            common: 1,
          }
          result =
            (order[a.rarity?.toLowerCase() || ''] || 0) -
            (order[b.rarity?.toLowerCase() || ''] || 0)
          break
        default:
          break
      }
      return filterState.sortOrderAsc ? result : -result
    })
  }

  const sortedAndFilteredCards = useMemo(() => {
    const filtered = filterCards(cards)
    return sortCards(filtered)
  }, [
    cards,
    debouncedSearchQuery,
    filterState.selectedColors,
    filterState.selectedTypes,
    filterState.selectedRarities,
    filterState.sortOption,
    filterState.sortOrderAsc,
  ])

  return {
    sortOption: filterState.sortOption,
    setSortOption: (option: string) =>
      setFilterState(prev => ({ ...prev, sortOption: option })),
    sortOrderAsc: filterState.sortOrderAsc,
    setSortOrderAsc: (asc: boolean) =>
      setFilterState(prev => ({ ...prev, sortOrderAsc: asc })),
    searchQuery: filterState.searchQuery,
    setSearchQuery: (query: string) =>
      setFilterState(prev => ({ ...prev, searchQuery: query })),
    selectedColors: filterState.selectedColors,
    toggleColorFilter,
    selectedTypes: filterState.selectedTypes,
    toggleTypeFilter,
    selectedRarities: filterState.selectedRarities,
    toggleRarityFilter,
    sortedAndFilteredCards,
  }
}
