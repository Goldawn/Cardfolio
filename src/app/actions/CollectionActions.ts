import { getAuthenticatedUser } from '@/lib/getAuthenticatedUser'
import { prisma } from '@/lib/prisma'
import 'server-only'

async function getDefaultCollectionId(): Promise<string | null> {
  'use server'
  // ✅ Revalide l'utilisateur côté action pour éviter d'utiliser un userId capturé
  const actionUser = await getAuthenticatedUser({ throwError: true })
  const row = await prisma.collection.findFirst({
    where: { userId: actionUser.id },
    select: { id: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })
  return row?.id ?? null
}

export async function addToCollectionAction(
  externalId: string,
  newPriceEntry: any
): Promise<any> {
  'use server'
  const actionUser = await getAuthenticatedUser({ throwError: true })
  const userId = actionUser.id

  const collectionId = await getDefaultCollectionId()
  if (!collectionId) return { kind: 'noop' }

  // Trouver la carte par externalId
  const card = await prisma.card.findFirst({
    where: { externalId },
    select: { id: true },
  })

  if (!card) {
    // Si la carte n'existe pas, on pourrait l'importer ici ou retourner une erreur
    return { kind: 'error', message: 'Card not found' }
  }

  const existing = await prisma.card.findFirst({
    where: {
      id: card.id,
      collectionId: collectionId,
    },
    select: { id: true, quantity: true, priceHistory: true },
  })

  const mergedHistory = Array.isArray(existing?.priceHistory)
    ? [...((existing && existing.priceHistory) || []), newPriceEntry]
    : [newPriceEntry]

  let saved
  if (existing) {
    saved = await prisma.card.update({
      where: { id: existing.id },
      data: {
        quantity: { increment: 1 },
        priceHistory: mergedHistory,
        collectionId: collectionId,
      },
      select: {
        id: true,
        externalId: true,
        quantity: true,
        priceHistory: true,
      },
    })
  } else {
    saved = await prisma.card.update({
      where: { id: card.id },
      data: {
        quantity: 1,
        priceHistory: mergedHistory,
        collectionId: collectionId,
      },
      select: {
        id: true,
        externalId: true,
        quantity: true,
        priceHistory: true,
      },
    })
  }

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

export async function updateCollectionQuantityAction(
  externalId: string,
  delta: number
) {
  'use server'
  const actionUser = await getAuthenticatedUser({ throwError: true })
  const userId = actionUser.id

  if (!delta || typeof delta !== 'number') return { kind: 'noop' }

  const collectionId = await getDefaultCollectionId()
  if (!collectionId) return { kind: 'noop' }

  // Trouver la carte par externalId
  const card = await prisma.card.findFirst({
    where: { externalId },
    select: { id: true, gameType: true },
  })

  if (!card) {
    return { kind: 'error', message: 'Card not found' }
  }

  const existing = await prisma.card.findFirst({
    where: {
      id: card.id,
      collectionId: collectionId,
    },
    select: { id: true, quantity: true },
  })

  if (!existing) {
    if (delta > 0) {
      const created = await prisma.card.update({
        where: { id: card.id },
        data: {
          collectionId: collectionId as string,
          quantity: delta as number,
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
    return { kind: 'noop' }
  }

  const nextQty = existing.quantity + delta
  if (nextQty <= 0) {
    await prisma.card.update({
      where: { id: existing.id },
      data: { collectionId: null, quantity: 0 },
    })
    await prisma.collectionChangeLog.create({
      data: {
        userId,
        cardId: card.id,
        changeType: 'remove',
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

export async function removeFromCollectionAction(externalId: string) {
  'use server'
  const actionUser = await getAuthenticatedUser({ throwError: true })
  const userId = actionUser.id

  const collectionId = await getDefaultCollectionId()
  if (!collectionId) return { kind: 'noop' }

  // Trouver la carte par externalId
  const card = await prisma.card.findFirst({
    where: { externalId },
    select: { id: true, gameType: true },
  })

  if (!card) {
    return { kind: 'error', message: 'Card not found' }
  }

  const existing = await prisma.card.findFirst({
    where: {
      id: card.id,
      collectionId: collectionId,
    },
    select: { id: true, quantity: true },
  })
  if (!existing) return { kind: 'noop' }

  await prisma.card.update({
    where: { id: existing.id },
    data: { collectionId: null, quantity: 0 },
  })

  await prisma.collectionChangeLog.create({
    data: {
      userId,
      cardId: card.id,
      changeType: 'remove',
      quantity: -existing.quantity,
      totalAfter: 0,
    },
  })

  return JSON.parse(JSON.stringify({ kind: 'deleted', externalId }))
}
