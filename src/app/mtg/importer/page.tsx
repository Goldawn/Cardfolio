import { getAuthenticatedUser } from '@/lib/getAuthenticatedUser'
import { prisma } from '@/lib/prisma'
import type { JSX } from 'react'
import ImportClient from './ImportClient'

export default async function MTGImportPage(): Promise<JSX.Element> {
  const user = await getAuthenticatedUser()

  if (!user) {
    return <p>Veuillez vous connecter pour accéder à cette page.</p>
  }

  const userId = user.id

  // On récupère les collections & wishlists
  const [collectionsFromDb, wishlistListsFromDb] = await Promise.all([
    prisma.collection.findMany({
      where: { userId },
      include: { cards: true }, // <- CollectionItem[]
      orderBy: { createdAt: 'asc' },
    }),
    prisma.wishlistList.findMany({
      where: { userId },
      include: { cards: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // On force "une seule collection par utilisateur" (Main).
  // Si aucune n'existe, on la crée MAINTENANT (pas dans l'action).
  let defaultCollection =
    collectionsFromDb.find(c => c.isDefault) ?? collectionsFromDb[0]

  if (!defaultCollection) {
    defaultCollection = await prisma.collection.create({
      data: { userId, name: 'Main', isDefault: true },
      include: { cards: true },
    })
  }

  const collectionId = defaultCollection.id

  // Données initiales sérialisables pour le client
  const initialCollection = JSON.parse(
    JSON.stringify(defaultCollection.cards ?? [])
  )
  const initialWishlistLists = JSON.parse(JSON.stringify(wishlistListsFromDb))

  // ------------------- Server Actions -------------------

  /** Ajoute/incrémente une carte dans la collection par défaut (CollectionItem) */
  async function addToCollectionAction(
    externalId: string,
    newPriceEntry: any
  ): Promise<any> {
    'use server'

    // Cherche l’item pour (collectionId, externalId)
    const existing = await prisma.card.findFirst({
      where: { collectionId, externalId },
      select: { id: true, quantity: true, priceHistory: true },
    })

    const mergedHistory = Array.isArray(existing?.priceHistory)
      ? [...(existing.priceHistory || []), newPriceEntry]
      : [newPriceEntry]

    let saved
    if (existing) {
      saved = await prisma.card.update({
        where: { id: existing.id },
        data: {
          quantity: { increment: 1 },
          priceHistory: mergedHistory,
        },
        select: {
          id: true,
          externalId: true,
          quantity: true,
          priceHistory: true,
        },
      })
    } else {
      saved = await prisma.card.create({
        data: {
          collectionId,
          cardId: card.id,
          quantity: 1,
          priceHistory: mergedHistory,
        },
        select: {
          id: true,
          externalId: true,
          quantity: true,
          priceHistory: true,
        },
      })
    }

    // (optionnel) log
    await prisma.collectionChangeLog.create({
      data: {
        userId,
        cardId: card.id,
        changeType: existing ? 'add' : 'create',
        quantity: +1,
        totalAfter: saved.quantity,
      },
    })

    return JSON.parse(
      JSON.stringify({ kind: existing ? 'updated' : 'created', item: saved })
    )
  }

  /** Décrémente ou supprime la carte dans la collection par défaut */
  async function _undoAddToCollectionAction(externalId: string): Promise<any> {
    'use server'

    const existing = await prisma.card.findFirst({
      where: { collectionId, externalId },
      select: { id: true, quantity: true },
    })

    if (!existing) {
      return JSON.parse(JSON.stringify({ kind: 'noop' }))
    }

    if (existing.quantity <= 1) {
      await prisma.card.delete({ where: { id: existing.id } })

      await prisma.collectionChangeLog.create({
        data: {
          userId,
          cardId: card.id,
          changeType: 'remove',
          quantity: -1,
          totalAfter: 0,
        },
      })

      return JSON.parse(JSON.stringify({ kind: 'deleted', externalId }))
    }

    const updated = await prisma.card.update({
      where: { id: existing.id },
      data: { quantity: { decrement: 1 } },
      select: { id: true, externalId: true, quantity: true },
    })

    await prisma.collectionChangeLog.create({
      data: {
        userId,
        cardId: card.id,
        changeType: 'remove',
        quantity: -1,
        totalAfter: updated.quantity,
      },
    })

    return JSON.parse(JSON.stringify({ kind: 'updated', item: updated }))
  }

  /** Met à jour la quantité d'une carte dans la collection */
  async function updateCollectionQuantityAction(
    externalId: string,
    delta: number
  ): Promise<any> {
    'use server'

    if (!delta || typeof delta !== 'number') {
      return JSON.parse(JSON.stringify({ kind: 'noop' }))
    }

    // const collectionId = await getDefaultCollectionId();
    // if (!collectionId) return JSON.parse(JSON.stringify({ kind: "noop" }));

    const existing = await prisma.card.findFirst({
      where: { collectionId: collectionsFromDb[0]?.id, externalId },
      select: { id: true, quantity: true },
    })

    if (!existing) {
      // si delta > 0 et pas d'item → on peut créer, sinon noop
      if (delta > 0) {
        const created = await prisma.card.create({
          data: {
            collectionId: collectionsFromDb[0]?.id,
            cardId: card.id,
            quantity: delta,
            priceHistory: [],
          },
          select: { id: true, externalId: true, quantity: true },
        })
        await prisma.collectionChangeLog.create({
          data: {
            userId,
            cardId: card.id,
            changeType: 'add',
            quantity: delta,
            totalAfter: created.quantity,
          },
        })
        return JSON.parse(JSON.stringify({ kind: 'updated', item: created }))
      }
      return JSON.parse(JSON.stringify({ kind: 'noop' }))
    }

    const nextQty = existing.quantity + delta

    if (nextQty <= 0) {
      await prisma.card.delete({ where: { id: existing.id } })
      await prisma.collectionChangeLog.create({
        data: {
          userId,
          cardId: card.id,
          changeType: 'remove_all',
          quantity: -existing.quantity,
          totalAfter: 0,
        },
      })
      return JSON.parse(JSON.stringify({ kind: 'deleted', externalId }))
    }

    const updated = await prisma.card.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
      select: { id: true, externalId: true, quantity: true },
    })

    await prisma.collectionChangeLog.create({
      data: {
        userId,
        cardId: card.id,
        changeType: delta > 0 ? 'add' : 'remove',
        quantity: delta,
        totalAfter: updated.quantity,
      },
    })

    return JSON.parse(JSON.stringify({ kind: 'updated', item: updated }))
  }

  /**  Crée une nouvelle wishlist */
  async function createWishlistAction(name: string = 'wishlist'): Promise<any> {
    'use server'

    const user = await getAuthenticatedUser({ throwError: true })
    const created = await prisma.wishlistList.create({
      data: {
        name: name?.trim() || 'wishlist',
        userId: user.id,
      },
      select: { id: true, name: true },
    })
    // structure homogène avec le state client
    return { list: { ...created, items: [] } }
  }

  /** Ajoute à une wishlist */
  async function addToWishlistAction(
    listId: string,
    externalId: string,
    quantity: number = 1
  ): Promise<any> {
    'use server'

    // sécurise la liste pour ce user
    const list = await prisma.wishlistList.findFirst({
      where: { id: listId, userId },
      select: { id: true },
    })
    if (!list) {
      throw new Error('Liste introuvable ou non autorisée.')
    }

    const existingItem = await prisma.card.findFirst({
      where: { wishlistId: listId, externalId },
      select: { id: true, quantity: true },
    })

    let saved
    if (existingItem) {
      saved = await prisma.card.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: quantity } },
        select: {
          id: true,
          wishlistId: true,
          externalId: true,
          quantity: true,
        },
      })
    } else {
      saved = await prisma.card.create({
        data: { wishlistId: listId, externalId, quantity },
        select: {
          id: true,
          wishlistId: true,
          externalId: true,
          quantity: true,
        },
      })
    }

    return JSON.parse(
      JSON.stringify({
        kind: existingItem ? 'updated' : 'created',
        item: saved,
      })
    )
  }

  // Supprime tous les exemplaires d'une carte de la collection
  async function removeFromCollectionAction(externalId: string): Promise<any> {
    'use server'

    // retrouve la collection par défaut (sécurité : on relit à chaque action)
    const def = await prisma.collection.findFirst({
      where: { userId },
      select: { id: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })
    const collectionId = def?.id
    if (!collectionId) return JSON.parse(JSON.stringify({ kind: 'noop' }))

    const existing = await prisma.card.findFirst({
      where: { collectionId, externalId },
      select: { id: true, quantity: true },
    })
    if (!existing) return JSON.parse(JSON.stringify({ kind: 'noop' }))

    await prisma.card.delete({ where: { id: existing.id } })

    await prisma.collectionChangeLog.create({
      data: {
        userId,
        cardId: card.id,
        changeType: 'remove_all',
        quantity: -existing.quantity,
        totalAfter: 0,
      },
    })

    return JSON.parse(JSON.stringify({ kind: 'deleted', externalId }))
  }

  return (
    <ImportClient
      userId={userId}
      initialCollection={initialCollection}
      initialWishlistLists={initialWishlistLists}
      actions={{
        addToCollection: addToCollectionAction,
        // undoAddToCollection: undoAddToCollectionAction,
        updateCollectionQuantity: updateCollectionQuantityAction,
        removeFromCollection: removeFromCollectionAction,
        createWishlist: createWishlistAction,
        addToWishlist: addToWishlistAction,
      }}
    />
  )
}
