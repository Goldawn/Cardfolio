'use client'

import { prisma } from '@/lib/prisma'
import type { GameCard } from '@/types'
import { transformPrismaResults } from '@/types/utils/cardHelpers'
import { useCallback, useEffect, useState } from 'react'

// Hook useDebounce simple
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface WishlistSearchSectionProps {
  userId: string
  wishlistLists: any[]
  StopAddingToWishlist: () => void
  wishlistId: string
  onHoverCard: (cardId: string, imageUrl: string) => void
  onCardAdded: (card: GameCard, quantity: number) => void
}

export default function WishlistSearchSection({
  userId: _userId,
  wishlistLists: _wishlistLists,
  StopAddingToWishlist: _StopAddingToWishlist,
  wishlistId: _wishlistId,
  onHoverCard: _onHoverCard,
  onCardAdded,
}: WishlistSearchSectionProps) {
  const [searchInput, setSearchInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<GameCard[]>([])
  const [loading, setLoading] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [freezeAutocomplete, setFreezeAutocomplete] = useState(false)

  const debouncedQuery = useDebounce(searchInput, 300)

  // Suggestions (autocomplete) avec Prisma
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 3 || freezeAutocomplete)
        return setSuggestions([])
      try {
        // Recherche de suggestions dans la base de données
        const suggestionsResults = await prisma.card.findMany({
          where: {
            name: { contains: debouncedQuery },
          },
          select: {
            name: true,
          },
          distinct: ['name'],
          take: 10,
        })

        const newSuggestions = suggestionsResults.map(card => card.name)
        setSuggestions(newSuggestions)
      } catch (error) {
        console.error('Erreur chargement suggestions:', error)
        setSuggestions([])
      }
    }
    fetchSuggestions()
  }, [debouncedQuery, freezeAutocomplete])

  // Recherche générale avec Prisma
  const handleSearch = async (query: string): Promise<void> => {
    const q = (query ?? searchInput).trim()
    if (!q) return

    setLoading(true)
    setSuggestions([]) // ferme la liste
    setHighlightIndex(-1)

    try {
      // Recherche directe avec Prisma
      const results = await prisma.card.findMany({
        where: {
          OR: [{ name: { contains: q } }, { setCode: { contains: q } }],
        },
        select: {
          id: true,
          externalId: true,
          name: true,
          gameType: true,
          gameData: true,
          imageSmall: true,
          imageNormal: true,
          imageLarge: true,
          setCode: true,
          setName: true,
          rarity: true,
          artist: true,
          collectorNumber: true,
        },
        take: 20,
      })

      // Transformer les résultats pour correspondre au format MTGCard
      const formattedResults = transformPrismaResults(results)

      setSearchResults(formattedResults)
    } catch (error) {
      console.error('Erreur chargement résultats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Recherche exacte des prints avec Prisma
  const handleSearchExactPrints = async (exactName: string): Promise<void> => {
    // 1) on gèle l'autocomplete pour éviter qu'il se rouvre (cas "Opt")
    setFreezeAutocomplete(true)
    setSuggestions([])
    setSearchResults([])
    setHighlightIndex(-1)
    setSearchInput(exactName)

    setLoading(true)
    try {
      // Recherche exacte par nom avec Prisma
      const results = await prisma.card.findMany({
        where: {
          name: { contains: exactName },
        },
        select: {
          id: true,
          externalId: true,
          name: true,
          gameType: true,
          gameData: true,
          imageSmall: true,
          imageNormal: true,
          imageLarge: true,
          setCode: true,
          setName: true,
          rarity: true,
          artist: true,
          collectorNumber: true,
        },
        take: 20,
      })

      // Transformer les résultats pour correspondre au format MTGCard
      const formattedResults = transformPrismaResults(results)

      setSearchResults(formattedResults)
    } catch (error) {
      console.error('Erreur chargement prints exacts:', error)
      // Fallback vers la recherche générale
      await handleSearch(exactName)
    } finally {
      setLoading(false)
    }
  }

  // Gestion des touches clavier
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (suggestions.length === 0) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightIndex(prev => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
            handleSearchExactPrints(suggestions[highlightIndex])
          } else {
            handleSearch(searchInput)
          }
          break
        case 'Escape':
          setSuggestions([])
          setHighlightIndex(-1)
          break
      }
    },
    [suggestions, highlightIndex, searchInput]
  )

  // Ajout à la wishlist
  const handleAddToWishlist = async (card: GameCard, quantity: number = 1) => {
    try {
      // Logique d'ajout à la wishlist (inchangée)
      // ... votre logique existante ...

      if (onCardAdded) {
        onCardAdded(card, quantity)
      }
    } catch (error) {
      console.error('Erreur ajout wishlist:', error)
    }
  }

  return (
    <div className="wishlist-search-section">
      <h3>Rechercher des cartes</h3>

      {/* Input de recherche */}
      <div className="search-container">
        <input
          type="text"
          value={searchInput}
          onChange={e => {
            setSearchInput(e.target.value)
            setFreezeAutocomplete(false)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Nom de la carte..."
          className="search-input"
        />

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.slice(0, 10).map((suggestion, index) => (
              <div
                key={index}
                className={`suggestion-item ${index === highlightIndex ? 'highlighted' : ''}`}
                onClick={() => handleSearchExactPrints(suggestion)}
                onMouseEnter={() => setHighlightIndex(index)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton de recherche */}
      <button
        onClick={() => handleSearch(searchInput)}
        disabled={loading}
        className="search-button"
      >
        {loading ? 'Recherche...' : 'Rechercher'}
      </button>

      {/* Résultats */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h4>Résultats ({searchResults.length})</h4>
          <div className="cards-grid">
            {searchResults.map(card => (
              <div key={card.id} className="card-item">
                <div className="card-info">
                  <h5>{card.name}</h5>
                  <p>
                    {card.setCode} - {card.rarity}
                  </p>
                  <p>Prix: ${(card as any).priceHistory?.[0]?.usd || 'N/A'}</p>
                </div>
                <div className="card-actions">
                  <button
                    onClick={() => handleAddToWishlist(card, 1)}
                    className="add-button"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
