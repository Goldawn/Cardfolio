'use client'

import { useState, useCallback, useEffect } from 'react'
import Card from './Card'
import styles from './FetchCardInput.module.css'
import { cardApiManager } from '@/app/services/CardApiManager'
import type { JSX } from 'react'
import type { GameCard } from '@/types'

export default function FetchCardInput(): JSX.Element {
  const [hoveredCardImageByList, setHoveredCardImageByList] = useState<Record<string, string>>({})
  
  // États locaux pour la recherche
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GameCard[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Rechercher des cartes complètes (résultats)
  const handleSearch = useCallback(async (searchQuery: string): Promise<void> => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const results = await cardApiManager.searchCards(searchQuery, {
        unique: 'prints' // Pour afficher toutes les variations d'une carte
      })
      setSearchResults(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la recherche')
      console.error('Erreur lors de la recherche:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Mise à jour des suggestions
  const updateSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    try {
      const newSuggestions = await cardApiManager.getAutocompleteSuggestions(searchQuery)
      setSuggestions(newSuggestions)
    } catch (err) {
      console.error('Erreur lors de la récupération des suggestions:', err)
    }
  }, [])

  // Mise à jour des suggestions avec debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateSuggestions(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, updateSuggestions])

  const handleInputChange = (value: string) => {
    setQuery(value)
  }

  const handleHoverCard = (listId: string, imageUrl: string): void => {
    setHoveredCardImageByList(prev => ({
      ...prev,
      [listId]: imageUrl,
    }))
  }

  return (
    <section className={styles.searchSection}>
      <div className={styles.searchContainer}>
        <h2>Rechercher des cartes</h2>
        
        {/* Input de recherche */}
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(query)
              }
            }}
            placeholder="Nom de la carte..."
            className={styles.searchInput}
          />
          <button
            onClick={() => handleSearch(query)}
            disabled={loading}
            className={styles.searchButton}
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className={styles.suggestions}>
            {suggestions.slice(0, 10).map((suggestion, index) => (
              <div
                key={index}
                className={styles.suggestionItem}
                onClick={() => {
                  setQuery(suggestion)
                  handleSearch(suggestion)
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}

        {/* Affichage des erreurs */}
        {error && (
          <div className={styles.error}>
            Erreur: {error}
          </div>
        )}

        {/* Résultats de recherche */}
        {searchResults.length > 0 && (
          <div className={styles.resultsContainer}>
            <h3>Résultats ({searchResults.length})</h3>
            <div className={styles.cardsGrid}>
              {searchResults.map((card) => (
                <div
                  key={card.id}
                  className={styles.cardWrapper}
                  onMouseEnter={() => handleHoverCard(card.id, card.image?.normal || '')}
                  onMouseLeave={() => handleHoverCard(card.id, '')}
                >
                  <Card card={card} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image hover */}
        {Object.entries(hoveredCardImageByList).map(([listId, imageUrl]) => 
          imageUrl && (
            <div key={listId} className={styles.hoverImage}>
              <img src={imageUrl} alt="Card preview" />
            </div>
          )
        )}
      </div>
    </section>
  )
}
