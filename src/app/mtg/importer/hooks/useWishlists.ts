import type { WishlistList } from '@/types/collections'
import { useMemo, useState, useTransition } from 'react'

export interface WishlistActions {
  createWishlist: (name: string) => Promise<any>
  addToWishlist: (
    listId: string,
    cardId: string,
    quantity: number
  ) => Promise<any>
}

export function useWishlists(
  initialWishlistLists: WishlistList[],
  actions: WishlistActions
) {
  const [wishlistLists, setWishlistLists] = useState<WishlistList[]>(
    initialWishlistLists || []
  )

  const [isPending, startTransition] = useTransition()

  // Calculer les totaux wishlist par cardId (toutes listes)
  const wishlistTotals = useMemo(() => {
    const map = new Map<string, number>()
    wishlistLists.forEach((list: WishlistList) => {
      list.cards.forEach((item: WishlistItem) => {
        const prev = map.get(item.cardId) || 0
        map.set(item.cardId, prev + item.quantity)
      })
    })
    return map
  }, [wishlistLists])

  // Créer une nouvelle wishlist
  const createWishlist = async (name = 'wishlist') => {
    try {
      const res = await actions.createWishlist(name)
      const { list } = res || {}
      if (!list?.id) return null

      setWishlistLists(prev => {
        const exists = prev.some(l => l.id === list.id)
        if (exists) return prev
        return [...prev, { ...list, items: list.cards ?? [] }]
      })
      return list.id
    } catch (e) {
      console.error('Erreur createWishlist:', e)
      return null
    }
  }

  // Ajouter une carte à une wishlist
  const addToWishlist = (listId: string, card: any): void => {
    if (!listId) return

    startTransition(async () => {
      try {
        const result = await actions.addToWishlist(listId, card.id, 1)
        const { item } = result || {}
        if (!item) return

        setWishlistLists(prev =>
          prev.map(list => {
            if (list.id !== listId) return list
            const idx = list.cards.findIndex(
              (it: WishlistItem) => it.cardId === card.id
            )
            if (idx === -1) {
              return {
                ...list,
                items: [
                  ...list.cards,
                  {
                    id: item.id,
                    cardId: card.id,
                    quantity: item.quantity,
                    dateAdded: new Date(),
                    updatedAt: new Date(),
                    wishlistId: listId,
                  },
                ],
              }
            }
            const newItems = [...list.cards]
            newItems[idx] = {
              ...newItems[idx],
              quantity: item.quantity,
              updatedAt: new Date(),
            }
            return { ...list, items: newItems }
          })
        )
      } catch (err) {
        console.error('Erreur addToWishlist (server action) :', err)
      }
    })
  }

  return {
    wishlistLists,
    wishlistTotals,
    isPending,
    createWishlist,
    addToWishlist,
  }
}
