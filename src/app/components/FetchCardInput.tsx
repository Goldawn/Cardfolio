/**
 * ⚠️  FICHIER PARTIELLEMENT REFACTORISÉ
 * Ce fichier contient encore du code mort qui doit être migré vers Prisma
 * TODO: Remplacer tous les appels API par des requêtes Prisma directes
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import Card from './Card'
import styles from './FetchCardInput.module.css'
// CardApiManager supprimé - utiliser Prisma directement'
import type { JSX } from 'react'
import type { GameCard, ApiResponse } from '@/types'

export default function FetchCardInput(): JSX.Element {
  const [hoveredCardImageByList, setHoveredCardImageByList] = useState<Record<string, string>>({})
  
  // États locaux pour la recherche
  const [query, setQuery] = useState('')
  const [searchResponse, setSearchResponse] = useState<ApiResponse<GameCard[]>>({
    data: [],
    error: undefined,
    loading: false
  })
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Rechercher des cartes complètes (résultats)
  const handleSearch = useCallback(async (searchQuery: string): Promise<void> => {
    if (!searchQuery.trim()) {
      setSearchResponse({ data: [], error: undefined, loading: false })
      return
    }

    setSearchResponse(prev => ({ ...prev, loading: true, error: undefined }))
    
    try {
      const results = await /* TODO: Remplacer par Prisma */ cardApiManager./* TODO: Remplacer par prisma.card.findMany */ searchCards(searchQuery, {
        unique: 'prints' // Pour afficher toutes les variations d'une carte
      })
      setSearchResponse({ data: results, error: undefined, loading: false })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la recherche'
      setSearchResponse({ data: [], error: errorMessage, loading: false })
      console.error('Erreur lors de la recherche:', err)
    }
  }, [])

  // Mise à jour des suggestions
  const updateSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    try {
      const newSuggestions = await /* TODO: Remplacer par Prisma */ cardApiManager.getAutocompleteSuggestions(searchQuery)
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
            disabled={searchResponse.loading}
            className={styles.searchButton}
          >
            {searchResponse.loading ? 'Recherche...' : 'Rechercher'}
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
        {searchResponse.error && (
          <div className={styles.error}>
            Erreur: {searchResponse.error}
          </div>
        )}

        {/* Résultats de recherche */}
        {searchResponse.data && searchResponse.data.length > 0 && (
          <div className={styles.resultsContainer}>
            <h3>Résultats ({searchResponse.data.length})</h3>
            <div className={styles.cardsGrid}>
              {searchResponse.data.map((card) => (
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
