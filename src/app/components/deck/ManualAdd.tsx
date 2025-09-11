'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { cardApiManager } from '@/app/services/CardApiManager'
import type { MTGCard } from '@/types/games/magic'
import styles from './AddFromCollection.module.css'

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

interface ManualAddProps {
  deckId: string
  onAdd: (scryfallId: string, qty: number) => Promise<void>
  defaultQty?: number
}

export default function ManualAdd({
  deckId,
  onAdd,
  defaultQty = 1,
}: ManualAddProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MTGCard[]>([]) // cartes formatées
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qtyById, setQtyById] = useState<Record<string, number>>({})
  const [isPending, startTransition] = useTransition()
  const abortRef = useRef<AbortController | null>(null)

  const debouncedQuery = useDebounce(query, 350)

  // Instance du service Card API
  const cardService = cardApiManager.getCardService()

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults([])
      setError('')
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const ctrl = new AbortController()
      abortRef.current = ctrl

      try {
        // Utilisation du nouveau service Card API
        const searchResults = await cardService.searchCards({ 
          query: debouncedQuery,
          options: {
            // Tu peux enrichir la requête avec des opérateurs (t:creature, set:woe…)
            // Ces options seront passées au provider Scryfall
          }
        })

        if (cancelled) return

        setResults(searchResults)
      } catch (e: any) {
        if (!cancelled && e.name !== 'AbortError') {
          console.error('Recherche Scryfall:', e)
          setError("Impossible d'effectuer la recherche. Réessaie.")
          setResults([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [debouncedQuery])

  const handleAdd = async (scryfallId: string, qty: number) => {
    startTransition(async () => {
      try {
        await onAdd(scryfallId, qty)
        // Optionnel: retirer de la liste des résultats
        setResults(prev => prev.filter(card => card.id !== scryfallId))
      } catch (err) {
        console.error('Erreur ajout carte:', err)
      }
    })
  }

  const updateQty = (scryfallId: string, newQty: number) => {
    setQtyById(prev => ({
      ...prev,
      [scryfallId]: Math.max(1, newQty)
    }))
  }

  const getQty = (scryfallId: string) => qtyById[scryfallId] || defaultQty

  return (
    <div className={styles.manualAddContainer}>
      <h3>Ajouter manuellement</h3>
      
      {/* Input de recherche */}
      <div className={styles.searchInputContainer}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom de la carte (ex: Lightning Bolt, t:creature, set:woe...)"
          className={styles.searchInput}
        />
        {loading && <div className={styles.loadingSpinner}>Recherche...</div>}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {/* Résultats de recherche */}
      {results.length > 0 && (
        <div className={styles.resultsContainer}>
          <h4>Résultats ({results.length})</h4>
          <div className={styles.resultsList}>
            {results.map((card) => (
              <div key={card.id} className={styles.resultItem}>
                <div className={styles.cardInfo}>
                  <div className={styles.cardImage}>
                    {card.image?.small && (
                      <img 
                        src={card.image.small} 
                        alt={card.name}
                        className={styles.cardImageSmall}
                      />
                    )}
                  </div>
                  <div className={styles.cardDetails}>
                    <h5 className={styles.cardName}>{card.name}</h5>
                    <p className={styles.cardSet}>{card.setCode} - {card.rarity}</p>
                    <p className={styles.cardType}>{card.gameData?.typeLine}</p>
                    {card.gameData?.manaCost && (
                      <p className={styles.manaCost}>{card.gameData.manaCost}</p>
                    )}
                  </div>
                </div>
                
                <div className={styles.cardActions}>
                  <div className={styles.quantityControls}>
                    <button
                      onClick={() => updateQty(card.id, getQty(card.id) - 1)}
                      className={styles.qtyButton}
                      disabled={getQty(card.id) <= 1}
                    >
                      -
                    </button>
                    <span className={styles.quantity}>{getQty(card.id)}</span>
                    <button
                      onClick={() => updateQty(card.id, getQty(card.id) + 1)}
                      className={styles.qtyButton}
                    >
                      +
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleAdd(card.id, getQty(card.id))}
                    disabled={isPending}
                    className={styles.addButton}
                  >
                    {isPending ? 'Ajout...' : 'Ajouter'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si pas de résultats */}
      {debouncedQuery && !loading && results.length === 0 && !error && (
        <div className={styles.noResults}>
          Aucune carte trouvée pour "{debouncedQuery}"
        </div>
      )}
    </div>
  )
}
