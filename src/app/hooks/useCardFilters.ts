'use client'

import { useState, useEffect, useMemo } from 'react'
import type { GameCard } from '@/types'

export default function useCardFilters(cards: GameCard[] = []) {
  const [sortOption, setSortOption] = useState('name')
  const [sortOrderAsc, setSortOrderAsc] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const toggleColorFilter = (color: string): void => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    )
  }

  const toggleTypeFilter = (type: string): void => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  const toggleRarityFilter = (rarity: string): void => {
    setSelectedRarities(prev =>
      prev.includes(rarity) ? prev.filter(r => r !== rarity) : [...prev, rarity]
    )
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
        selectedColors.length === 0 ||
        card.colors?.some(color => selectedColors.includes(color)) ||
        (selectedColors.includes('C') && (card.colors?.length === 0)) ||
        (selectedColors.includes('M') && (card.colors?.length ?? 0) > 1)
      const matchesType =
        selectedTypes.length === 0 ||
        selectedTypes.some(type => 
          'type' in card.gameData ? card.gameData.type?.includes(type) : false
        )
      const matchesRarity =
        selectedRarities.length === 0 ||
        (card.rarity ? selectedRarities.includes(card.rarity.toLowerCase()) : false)
      return matchesSearch && matchesColor && matchesType && matchesRarity
    })
  }

  const sortCards = (cardsToSort: GameCard[]): GameCard[] => {
    return [...cardsToSort].sort((a, b) => {
      let result = 0
      switch (sortOption) {
        case 'price':
          result =
            parseFloat(String(a.priceHistory?.at(-1)?.eur || 0)) -
            parseFloat(String(b.priceHistory?.at(-1)?.eur || 0))
          break
        case 'name':
          result = (a.name || '').localeCompare(b.name || '')
          break
        case 'date':
          result = new Date(a.addedAt || '').getTime() - new Date(b.addedAt || '').getTime()
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
          const order: Record<string, number> = { mythic: 4, rare: 3, uncommon: 2, common: 1 }
          result =
            (order[a.rarity?.toLowerCase() || ''] || 0) -
            (order[b.rarity?.toLowerCase() || ''] || 0)
          break
        default:
          break
      }
      return sortOrderAsc ? result : -result
    })
  }

  const sortedAndFilteredCards = useMemo(() => {
    const filtered = filterCards(cards)
    return sortCards(filtered)
  }, [
    cards,
    debouncedSearchQuery,
    selectedColors,
    selectedTypes,
    selectedRarities,
    sortOption,
    sortOrderAsc,
  ])

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
  }
}
