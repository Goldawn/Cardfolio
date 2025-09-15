'use client'

import { prisma } from '@/lib/prisma'
import { transformPrismaResults } from '@/types/utils/cardHelpers'
import type { GameCard } from '@/types/utils/guards'
import { isMTGCard } from '@/types/utils/guards'
import { useEffect, useRef, useState, useTransition } from 'react'
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
  onAdd: (externalId: string, qty: number) => Promise<void>
  defaultQty?: number
}

export default function ManualAdd({
  deckId: _deckId,
  onAdd,
  defaultQty = 1,
}: ManualAddProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GameCard[]>([]) // cartes formatées
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qtyById, setQtyById] = useState<Record<string, number>>({})
  const [isPending, startTransition] = useTransition()
  const abortRef = useRef<AbortController | null>(null)

  const debouncedQuery = useDebounce(query, 350)

  // Utilisation directe de Prisma pour la recherche

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
        // Recherche directe dans la base de données avec Prisma
        const searchResults = await prisma.card.findMany({
          where: {
            OR: [
              { name: { contains: debouncedQuery } },
              { setCode: { contains: debouncedQuery } },
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
            setCode: true,
            rarity: true,
          },
          take: 20, // Limiter les résultats
        })

        if (cancelled) return

        // Transformer les résultats pour correspondre au format GameCard
        const formattedResults = transformPrismaResults(searchResults)

        setResults(formattedResults)
      } catch (e: any) {
        if (!cancelled && e.name !== 'AbortError') {
          console.error('Recherche base de données:', e)
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

  const handleAdd = async (externalId: string, qty: number) => {
    startTransition(async () => {
      try {
        await onAdd(externalId, qty)
        // Optionnel: retirer de la liste des résultats
        setResults(prev => prev.filter(card => card.id !== externalId))
      } catch (err) {
        console.error('Erreur ajout carte:', err)
      }
    })
  }

  const updateQty = (externalId: string, newQty: number) => {
    setQtyById(prev => ({
      ...prev,
      [externalId]: Math.max(1, newQty),
    }))
  }

  const getQty = (externalId: string) => qtyById[externalId] || defaultQty

  return (
    <div className={styles.manualAddContainer}>
      <h3>Ajouter manuellement</h3>

      {/* Input de recherche */}
      <div className={styles.searchInputContainer}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Nom de la carte, set code ou type..."
          className={styles.searchInput}
        />
        {loading && <div className={styles.loadingSpinner}>Recherche...</div>}
      </div>

      {/* Message d'erreur */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Résultats de recherche */}
      {results.length > 0 && (
        <div className={styles.resultsContainer}>
          <h4>Résultats ({results.length})</h4>
          <div className={styles.resultsList}>
            {results.map(card => (
              <div key={card.id} className={styles.resultItem}>
                <div className={styles.cardInfo}>
                  <div className={styles.cardImage}>
                    {card.image && (
                      <img
                        src={card.image}
                        alt={card.name}
                        className={styles.cardImageSmall}
                      />
                    )}
                  </div>
                  <div className={styles.cardDetails}>
                    <h5 className={styles.cardName}>{card.name}</h5>
                    <p className={styles.cardSet}>
                      {card.setCode} - {card.rarity}
                    </p>
                    <p className={styles.cardType}>
                      {isMTGCard(card) ? card.gameData?.typeLine : 'N/A'}
                    </p>
                    {isMTGCard(card) && card.gameData?.manaCost && (
                      <p className={styles.manaCost}>
                        {card.gameData.manaCost}
                      </p>
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
                    onClick={() => handleAdd(card.externalId, getQty(card.id))}
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
