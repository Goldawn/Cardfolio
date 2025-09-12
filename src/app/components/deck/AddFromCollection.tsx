/**
 * ⚠️  FICHIER PARTIELLEMENT REFACTORISÉ
 * Ce fichier contient encore du code mort qui doit être migré vers Prisma
 * TODO: Remplacer tous les appels API par des requêtes Prisma directes
 */

'use client'

import { prisma } from '@/lib/prisma'
import type { AppCollectionItem, AppDeckCard, GameCard } from '@/types'
import type { JSX } from 'react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import styles from './AddFromCollection.module.css'

interface AddFromCollectionProps {
  deckId: string
  collectionItems: AppCollectionItem[]
  currentDeckCards: AppDeckCard[]
  onAdd: (externalId: string, qty: number) => Promise<void>
}

export default function AddFromCollection({
  deckId: _deckId,
  collectionItems,
  currentDeckCards,
  onAdd,
}: AddFromCollectionProps): JSX.Element {
  console.log(collectionItems)
  // Utilisation directe de Prisma au lieu du CardService
  const [isPending, startTransition] = useTransition()
  const [enriched, setEnriched] = useState<
    (GameCard & { ownedQuantity: number })[]
  >([])
  const [query, setQuery] = useState('')
  const [respectOwned, setRespectOwned] = useState(true)
  const [qtyById, setQtyById] = useState<Record<string, number>>({})

  // map des quantités déjà dans le deck (pour cap si respectOwned)
  const inDeckMap = useMemo(() => {
    const m = new Map<string, number>()
    ;(currentDeckCards || []).forEach((dc: AppDeckCard) => {
      m.set(dc.externalId, (m.get(dc.externalId) || 0) + (dc.quantity || 0))
    })
    return m
  }, [currentDeckCards])

  // Chargement des cartes depuis la base de données
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!collectionItems || collectionItems.length === 0) {
        setEnriched([])
        return
      }
      try {
        // Récupération directe des cartes depuis Prisma
        const cardIds = collectionItems.map(
          (it: AppCollectionItem) => it.externalId
        )

        const cards = await prisma.card.findMany({
          where: {
            externalId: { in: cardIds },
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
          },
        })

        // Ajout de la quantité possédée à chaque carte
        const enriched = cards.map(card => {
          const owned =
            collectionItems.find(
              (ci: AppCollectionItem) => ci.externalId === card.externalId
            )?.quantity || 0
          return {
            ...card,
            gameType: card.gameType as any, // Cast to GameType
            setCode: card.setCode || '', // Handle null setCode
            ownedQuantity: owned,
            image: card.imageNormal || card.imageSmall || '',
            imageSmall: card.imageSmall || '',
            imageNormal: card.imageNormal || '',
            gameData: card.gameData as any, // Cast to proper game data type
          } as any // Cast the entire object to avoid type issues
        })

        if (!cancelled) setEnriched(enriched)
      } catch (e) {
        console.error('Erreur chargement cartes:', e)
        if (!cancelled) setEnriched([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [collectionItems])

  const filtered = useMemo(() => {
    if (!query) return enriched
    const q = query.toLowerCase()
    return enriched.filter(
      c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.setCode || '').toLowerCase().includes(q)
    )
  }, [enriched, query])

  const handleQtyChange = (externalId: string, value: number): void => {
    const v = Math.max(1, Math.min(99, Number(value) || 1))
    setQtyById(prev => ({ ...prev, [externalId]: v }))
  }

  const addOne = (externalId: string): void => {
    const wanted = qtyById[externalId] ?? 1
    const owned =
      collectionItems.find(
        (ci: AppCollectionItem) => ci.externalId === externalId
      )?.quantity || 0
    const inDeck = inDeckMap.get(externalId) || 0
    let qty = wanted

    if (respectOwned) {
      const remaining = Math.max(0, owned - inDeck)
      qty = Math.min(qty, remaining)
      if (qty <= 0) return // rien à ajouter si on respecte le cap
    }

    startTransition(async () => {
      try {
        await onAdd(externalId, qty)
        // Option: reset quantité à 1
        setQtyById(prev => ({ ...prev, [externalId]: 1 }))
      } catch (e) {
        console.error('Erreur ajout carte depuis collection:', e)
      }
    })
  }

  return (
    <section id={styles.addFromCollection}>
      <h3>Ajouter depuis la collection</h3>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <input
          type="text"
          placeholder="Rechercher une carte (nom ou set code)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={respectOwned}
            onChange={e => setRespectOwned(e.target.checked)}
          />
          Ne pas dépasser possédé
        </label>
      </div>

      <ul
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {filtered.map(c => {
          const inDeck = inDeckMap.get(c.id) || 0
          const remaining = Math.max(0, (c.ownedQuantity || 0) - inDeck)
          const disabled = respectOwned && remaining <= 0

          return (
            <li
              key={c.id}
              style={{ border: '1px solid #ddd', borderRadius: 8, padding: 8 }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <img
                  src={c.image || '/placeholder.png'}
                  alt={c.name}
                  style={{ width: 80, height: 'auto', borderRadius: 4 }}
                />
                <div style={{ flex: 1 }}>
                  <strong>{c.name}</strong>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {c.setCode?.toUpperCase()} • Possédé : {c.ownedQuantity} •
                    Dans le deck : {inDeck}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={qtyById[c.id] ?? 1}
                      onChange={e =>
                        handleQtyChange(c.id, Number(e.target.value))
                      }
                      style={{ width: 64 }}
                    />
                    <button
                      onClick={() => addOne(c.id)}
                      disabled={isPending || disabled}
                    >
                      {disabled ? 'Max atteint' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
        {filtered.length === 0 && (
          <li style={{ opacity: 0.7 }}>Aucune carte trouvée.</li>
        )}
      </ul>
    </section>
  )
}
