'use client'

import { useEffect, useState } from 'react'
import Card from './Card'
import styles from './FetchCardInput.module.css'
import { CardServiceFactory } from '@/card-api-service'
import type { JSX } from 'react'
import type { GameCard } from '@/types'

export default function FetchCardInput(): JSX.Element {
  const [searchInput, setSearchInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<GameCard[]>([])
  const [hoveredCardImageByList, setHoveredCardImageByList] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(false)

  // Instance du service Card API
  const cardService = CardServiceFactory.create()

  // Suggestions (autocomplete) - TODO: Implémenter dans le service
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchInput.length < 3) return setSuggestions([])
      try {
        // Pour l'instant, on garde l'ancien système d'autocomplete
        // TODO: Implémenter l'autocomplete dans le CardService
        const res = await fetch(
          `https://api.scryfall.com/cards/autocomplete?q=${searchInput}`
        )
        const data = await res.json()
        setSuggestions(data.data || [])
      } catch (error) {
        console.error('Erreur chargement suggestions:', error)
      }
    }
    fetchSuggestions()
  }, [searchInput])

  // Rechercher des cartes complètes (résultats) - NOUVEAU
  const handleSearch = async (query: string): Promise<void> => {
    setLoading(true)
    try {
      // Utilisation du nouveau service
      const results = await cardService.searchCards({ 
        query,
        options: {
          unique: 'prints' // Pour afficher toutes les variations d'une carte
        }
      })
      setSearchResults(results as GameCard[])
    } catch (error) {
      console.error('Erreur chargement résultats:', error)
    } finally {
      setLoading(false)
    }
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchInput)
              }
            }}
            placeholder="Nom de la carte..."
            className={styles.searchInput}
          />
          <button
            onClick={() => handleSearch(searchInput)}
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
                  setSearchInput(suggestion)
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
