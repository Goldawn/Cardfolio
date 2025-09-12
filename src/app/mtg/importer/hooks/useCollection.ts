import { useState, useTransition } from 'react'
import { fetchCardPrice } from '../../../services/pricing'
import type { AppCollectionItem, CollectionActions } from '@/types'

export function useCollection(
  initialCollection: AppCollectionItem[],
  actions: CollectionActions
) {
  const [collection, setCollection] = useState<AppCollectionItem[]>(
    initialCollection.map((c: any) => ({
      scryfallId: c.scryfallId,
      quantity: c.quantity,
      priceHistory: c.priceHistory,
      dbId: c.dbId || c.id || c.scryfallId, // Fallback pour dbId
    }))
  )

  const [recentlyAdded, setRecentlyAdded] = useState<Array<{ 
    id: string
    card: any
    count: number 
  }>>([])

  const [isPending, startTransition] = useTransition()

  // Mettre à jour le compteur "récemment ajouté"
  const bumpRecent = (card: any, delta: number): void => {
    if (!card?.id || !delta) return
    setRecentlyAdded(prev => {
      const idx = prev.findIndex(e => e.id === card.id)
      if (delta > 0) {
        if (idx === -1) {
          return [{ id: card.id, card, count: delta }, ...prev]
        }
        const copy = [...prev]
        copy[idx] = { ...copy[idx], count: copy[idx].count + delta }
        return copy
      } else {
        if (idx === -1) return prev
        const nextCount = prev[idx].count + delta
        if (nextCount <= 0) {
          const copy = [...prev]
          copy.splice(idx, 1)
          return copy
        }
        const copy = [...prev]
        copy[idx] = { ...copy[idx], count: nextCount }
        return copy
      }
    })
  }

  // Ajouter une carte à la collection
  const addToCollection = (card: any): void => {
    const scryfallId = card.id

    startTransition(async () => {
      try {
        const { usd, eur } = await fetchCardPrice(card.name)

        const _lastPrice = eur || usd || 0
        const newPriceEntry = {
          date: new Date().toISOString().split('T')[0],
          usd: usd,
          eur: eur,
        }

        const result = await actions.addToCollection(scryfallId, newPriceEntry)
        const { item } = result || {}
        if (!item) return

        setCollection(prev => {
          const idx = prev.findIndex(c => c.scryfallId === scryfallId)
          if (idx === -1) {
            return [
              ...prev,
              {
                scryfallId,
                quantity: item.quantity,
                priceHistory: item.priceHistory || [newPriceEntry],
                dbId: item.id || item.dbId || scryfallId,
              },
            ]
          }
          const copy = [...prev]
          copy[idx] = {
            ...copy[idx],
            quantity: item.quantity,
            priceHistory: item.priceHistory || copy[idx].priceHistory,
          }
          return copy
        })

        bumpRecent(card, 1)
      } catch (err) {
        console.error('Erreur addToCollection (server action) :', err)
      }
    })
  }

  // Mettre à jour la quantité d'une carte
  const updateQuantity = (cardId: string, delta: number): void => {
    startTransition(async () => {
      try {
        const result = await actions.updateCollectionQuantity(cardId, delta)
        if (!result) return

        if (result.kind === 'deleted') {
          setCollection(prev => prev.filter(c => c.scryfallId !== cardId))
          setRecentlyAdded(prev => prev.filter(e => e.id !== cardId))
          return
        }

        if (result.kind === 'updated' && result.item) {
          setCollection(prev => {
            const idx = prev.findIndex(c => c.scryfallId === cardId)
            if (idx === -1) {
              return [
                ...prev,
                {
                  scryfallId: cardId,
                  quantity: result.item.quantity,
                  priceHistory: [],
                  dbId: result.item.id || result.item.dbId || cardId,
                },
              ]
            }
            const copy = [...prev]
            copy[idx] = { ...copy[idx], quantity: result.item.quantity }
            return copy
          })
        }

        // Mettre à jour le compteur "récemment ajouté"
        const cardObj = { id: cardId }
        if (delta > 0) {
          bumpRecent(cardObj, delta)
        } else if (delta < 0) {
          bumpRecent(cardObj, delta)
        }
      } catch (err) {
        console.error('Erreur updateCollectionQuantity (server action) :', err)
      }
    })
  }

  // Supprimer une carte de la collection
  const removeFromCollection = (cardId: string): void => {
    startTransition(async () => {
      try {
        const result = await actions.removeFromCollection(cardId)
        if (result?.kind === 'deleted') {
          setCollection(prev => prev.filter(c => c.scryfallId !== cardId))
          setRecentlyAdded(prev => prev.filter(e => e.id !== cardId))
        }
      } catch (err) {
        console.error('Erreur removeFromCollection (server action) :', err)
      }
    })
  }

  // Gérer le clic sur une carte récemment ajoutée
  const handleRecentCardClick = (cardId: string, formattedCards: any[]): void => {
    const cardObj = formattedCards.find(c => c.id === cardId) || { id: cardId }
    startTransition(async () => {
      try {
        const result = await actions.updateCollectionQuantity(cardId, -1)
        if (!result) return

        if (result.kind === 'deleted') {
          setCollection(prev => prev.filter(c => c.scryfallId !== cardId))
        } else if (result.kind === 'updated' && result.item) {
          setCollection(prev =>
            prev.map(c =>
              c.scryfallId === cardId
                ? { ...c, quantity: result.item.quantity }
                : c
            )
          )
        }

        bumpRecent(cardObj, -1)
      } catch (err) {
        console.error('Erreur recent click (-1) :', err)
      }
    })
  }

  return {
    collection,
    recentlyAdded,
    isPending,
    addToCollection,
    updateQuantity,
    removeFromCollection,
    handleRecentCardClick
  }
}
