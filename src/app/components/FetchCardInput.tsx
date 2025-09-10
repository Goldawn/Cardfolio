'use client'

import { useState } from 'react'
import Card from './Card'
import styles from './FetchCardInput.module.css'
import { useCardSearch } from '@/app/hooks/useCardApi'
import type { JSX } from 'react'

export default function FetchCardInput(): JSX.Element {
  const [hoveredCardImageByList, setHoveredCardImageByList] = useState<Record<string, string>>({})
  
  // Utilisation du hook personnalisé pour la recherche
  const {
    query,
    results: searchResults,
    suggestions,
    loading,
    error,
    search,
    updateSuggestions,
    setQuery
  } = useCardSearch()

  // Rechercher des cartes complètes (résultats)
  const handleSearch = async (searchQuery: string): Promise<void> => {
    await search(searchQuery, {
      unique: 'prints' // Pour afficher toutes les variations d'une carte
    })
  }

  // Mise à jour des suggestions
  const handleInputChange = (value: string) => {
    setQuery(value)
    updateSuggestions(value)
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
