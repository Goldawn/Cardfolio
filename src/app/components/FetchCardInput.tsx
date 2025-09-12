'use client'

import { prisma } from '@/lib/prisma'
import type { MTGCard } from '@/types'
import type { JSX } from 'react'
import { useCallback, useEffect, useState } from 'react'
import Card from './Card'
import styles from './FetchCardInput.module.css'

// Helper pour obtenir l'URL d'image d'une carte
const getCardImageUrl = (card: MTGCard): string =>
  card.imageLarge || card.imageNormal || card.imageSmall || ''

export default function FetchCardInput(): JSX.Element {
  const [hoveredCardImageByList, setHoveredCardImageByList] = useState<
    Record<string, string>
  >({})

  // États locaux pour la recherche
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<MTGCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Rechercher des cartes dans la base de données
  const handleSearch = useCallback(
    async (searchQuery: string): Promise<void> => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        setError(undefined)
        return
      }

      setLoading(true)
      setError(undefined)

      try {
        // Recherche directe avec Prisma
        const results = await prisma.card.findMany({
          where: {
            OR: [
              { name: { contains: searchQuery } },
              { setCode: { contains: searchQuery } },
              // Note: Recherche dans gameData non supportée par SQLite, on la retire
            ],
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
          take: 20, // Limiter les résultats
        })

        // Transformer les résultats pour correspondre au format MTGCard
        const formattedResults = results.map(
          card =>
            ({
              id: card.externalId,
              externalId: card.externalId,
              name: card.name,
              gameType: card.gameType,
              setCode: card.setCode,
              setName: card.setName,
              rarity: card.rarity,
              artist: card.artist,
              collectorNumber: card.collectorNumber,
              gameData: card.gameData as any,
              image:
                card.imageLarge || card.imageNormal || card.imageSmall || '',
              imageSmall: card.imageSmall,
              imageNormal: card.imageNormal,
              imageLarge: card.imageLarge,
            }) as unknown as MTGCard
        )

        setSearchResults(formattedResults)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors de la recherche'
        setError(errorMessage)
        setSearchResults([])
        console.error('Erreur lors de la recherche:', err)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Mise à jour des suggestions avec Prisma
  const updateSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    try {
      // Recherche de suggestions dans la base de données
      const suggestionsResults = await prisma.card.findMany({
        where: {
          name: { contains: searchQuery },
        },
        select: {
          name: true,
        },
        distinct: ['name'],
        take: 10,
      })

      const newSuggestions = suggestionsResults.map(card => card.name)
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
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => {
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
        {error && <div className={styles.error}>Erreur: {error}</div>}

        {/* Résultats de recherche */}
        {searchResults && searchResults.length > 0 && (
          <div className={styles.resultsContainer}>
            <h3>Résultats ({searchResults.length})</h3>
            <div className={styles.cardsGrid}>
              {searchResults.map(card => (
                <div
                  key={card.id}
                  className={styles.cardWrapper}
                  onMouseEnter={() =>
                    handleHoverCard(card.id, getCardImageUrl(card))
                  }
                  onMouseLeave={() => handleHoverCard(card.id, '')}
                >
                  <Card card={card} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image hover */}
        {Object.entries(hoveredCardImageByList).map(
          ([listId, imageUrl]) =>
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
