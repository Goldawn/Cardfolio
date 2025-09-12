import {
  assertWishlistOwnership,
  getAuthenticatedUser,
} from '@/lib/getAuthenticatedUser'
import { prisma } from '@/lib/prisma'
import 'server-only'

export async function createWishlistAction(name = 'wishlist') {
  'use server'
  const authed = await getAuthenticatedUser({ throwError: true })
  const created = await prisma.wishlistList.create({
    data: {
      name: (name || 'wishlist').trim(),
      userId: authed.id,
    },
    select: { id: true, name: true },
  })
  return { list: { ...created, items: [] } }
}

export async function addManyToWishlistAction(
  listId: string,
  items: Array<{
    externalId: string
    quantity: number
  }> /* [{externalId, quantity}] */
) {
  'use server'
  await assertWishlistOwnership(listId)

  if (!Array.isArray(items) || items.length === 0) {
    return { items: [] }
  }

  // Traiter chaque item individuellement car nous devons d'abord trouver la carte par externalId
  const results = []

  for (const item of items) {
    const externalId = String(item?.externalId || '')
    const quantity = Number(item?.quantity || 0)

    if (!externalId || quantity <= 0) continue

    // Trouver la carte par externalId
    const card = await prisma.card.findFirst({
      where: { externalId },
      select: { id: true, quantity: true },
    })

    if (!card) {
      results.push({
        kind: 'error',
        message: `Carte non trouvée: ${externalId}`,
        externalId,
      })
      continue
    }

    // Vérifier si la carte est déjà dans cette wishlist
    const existing = await prisma.card.findFirst({
      where: {
        id: card.id,
        wishlistId: listId,
      },
      select: { id: true, quantity: true },
    })

    let updated
    if (existing) {
      // Mettre à jour la quantité existante
      updated = await prisma.card.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
        select: { id: true, externalId: true, quantity: true },
      })
      results.push({ kind: 'updated', item: updated })
    } else {
      // Ajouter la carte à la wishlist
      updated = await prisma.card.update({
        where: { id: card.id },
        data: {
          wishlistId: listId,
          quantity: quantity,
        },
        select: { id: true, externalId: true, quantity: true },
      })
      results.push({ kind: 'created', item: updated })
    }
  }

  return JSON.parse(JSON.stringify({ items: results }))
}
