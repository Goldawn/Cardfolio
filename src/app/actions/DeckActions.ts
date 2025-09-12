import { assertDeckOwnership } from '@/lib/getAuthenticatedUser'
import { prisma } from '@/lib/prisma'
import 'server-only'

async function getDeckIdFromCard(cardId: string) {
  'use server'
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { deckId: true },
  })
  return card?.deckId ?? null
}

export async function addCardToDeckAction(
  deckId: string,
  externalId: string,
  qty: number = 1
) {
  'use server'
  await assertDeckOwnership(deckId)

  if (!externalId || typeof qty !== 'number' || qty <= 0) {
    throw new Error("Paramètres invalides pour l'ajout de carte.")
  }

  // Trouver la carte par externalId
  const card = await prisma.card.findFirst({
    where: { externalId },
    select: { id: true, quantity: true },
  })

  if (!card) {
    throw new Error('Carte non trouvée.')
  }

  const existing = await prisma.card.findFirst({
    where: {
      id: card.id,
      deckId: deckId,
    },
    select: { id: true, quantity: true },
  })

  let saved
  if (existing) {
    saved = await prisma.card.update({
      where: { id: existing.id },
      data: {
        quantity: existing.quantity + qty,
        deckId: deckId,
      },
      select: { id: true, externalId: true, quantity: true, deckId: true },
    })
  } else {
    saved = await prisma.card.update({
      where: { id: card.id },
      data: {
        quantity: qty,
        deckId: deckId,
      },
      select: { id: true, externalId: true, quantity: true, deckId: true },
    })
  }

  return JSON.parse(
    JSON.stringify({ kind: existing ? 'updated' : 'created', item: saved })
  )
}

export async function updateDeckCardQtyAction(cardId: string, nextQty: number) {
  'use server'
  if (!cardId || typeof nextQty !== 'number') {
    throw new Error('Paramètres invalides.')
  }
  const targetDeckId = await getDeckIdFromCard(cardId)
  if (!targetDeckId) throw new Error('Carte introuvable.')
  await assertDeckOwnership(targetDeckId)

  if (nextQty <= 0) {
    const deleted = await prisma.card.update({
      where: { id: cardId },
      data: { deckId: null, quantity: 0 },
      select: { id: true, externalId: true, deckId: true },
    })
    return JSON.parse(JSON.stringify({ kind: 'deleted', item: deleted }))
  }

  const updated = await prisma.card.update({
    where: { id: cardId },
    data: { quantity: nextQty },
    select: { id: true, externalId: true, quantity: true, deckId: true },
  })
  return JSON.parse(JSON.stringify({ kind: 'updated', item: updated }))
}

export async function removeCardFromDeckAction(cardId: string) {
  'use server'
  if (!cardId) throw new Error('cardId requis.')

  const targetDeckId = await getDeckIdFromCard(cardId)
  if (!targetDeckId) throw new Error('Carte introuvable.')
  await assertDeckOwnership(targetDeckId)

  const deleted = await prisma.card.update({
    where: { id: cardId },
    data: { deckId: null, quantity: 0 },
    select: { id: true, externalId: true, deckId: true },
  })
  return JSON.parse(JSON.stringify({ kind: 'deleted', item: deleted }))
}

export async function bulkUpsertDeckCardsAction(
  deckId: string,
  entries: Array<{ externalId: string; qty: number }> /* [{externalId, qty}] */
) {
  'use server'
  await assertDeckOwnership(deckId)

  if (!Array.isArray(entries) || entries.length === 0) {
    return { kind: 'noop' }
  }

  const result = await prisma.$transaction(async tx => {
    const out = []
    for (const entry of entries) {
      const externalId = entry?.externalId
      const qty = Number(entry?.qty ?? 0)
      if (!externalId || qty <= 0) continue

      // Trouver la carte par externalId
      const card = await tx.card.findFirst({
        where: { externalId },
        select: { id: true },
      })

      if (!card) {
        out.push({ kind: 'error', message: `Carte non trouvée: ${externalId}` })
        continue
      }

      const existing = await tx.card.findFirst({
        where: {
          id: card.id,
          deckId: deckId,
        },
        select: { id: true, quantity: true },
      })

      let saved
      if (existing) {
        saved = await tx.card.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + qty,
            deckId: deckId,
          },
          select: { id: true, externalId: true, quantity: true, deckId: true },
        })
        out.push({ kind: 'updated', item: saved })
      } else {
        saved = await tx.card.update({
          where: { id: card.id },
          data: {
            deckId: deckId,
            quantity: qty,
          },
          select: { id: true, externalId: true, quantity: true, deckId: true },
        })
        out.push({ kind: 'created', item: saved })
      }
    }
    return out
  })

  return JSON.parse(JSON.stringify({ kind: 'bulk', items: result }))
}

export async function renameDeckAction(deckId: string, newName: string) {
  'use server'
  if (!newName || !newName.trim()) throw new Error('Nom invalide.')
  await assertDeckOwnership(deckId)

  const updated = await prisma.decklist.update({
    where: { id: deckId },
    data: { name: newName.trim() },
    select: { id: true, name: true },
  })
  return JSON.parse(JSON.stringify(updated))
}

export async function setDeckFormatAction(deckId: string, format: string) {
  'use server'
  await assertDeckOwnership(deckId)

  const updated = await prisma.decklist.update({
    where: { id: deckId },
    data: { format },
    select: { id: true, format: true },
  })
  return JSON.parse(JSON.stringify(updated))
}

export async function toggleDeckLockAction(deckId: string, force?: boolean) {
  'use server'
  await assertDeckOwnership(deckId)
  const deck = await prisma.decklist.findUnique({
    where: { id: deckId },
    select: { isLocked: true },
  })
  const next = typeof force === 'boolean' ? force : !deck?.isLocked
  const updated = await prisma.decklist.update({
    where: { id: deckId },
    data: { isLocked: next },
    select: { id: true, isLocked: true },
  })
  return JSON.parse(JSON.stringify(updated))
}

export async function updateDeckNotesAction(deckId: string, notes: string) {
  'use server'
  await assertDeckOwnership(deckId)
  const updated = await prisma.decklist.update({
    where: { id: deckId },
    data: { notes },
    select: { id: true, notes: true },
  })
  return JSON.parse(JSON.stringify(updated))
}

export async function duplicateDeckAction(deckId: string) {
  'use server'
  await assertDeckOwnership(deckId)

  // charge deck + ses cartes
  const deck = await prisma.decklist.findUnique({
    where: { id: deckId },
    include: { cards: true },
  })
  if (!deck) throw new Error('Deck introuvable')

  const copy = await prisma.decklist.create({
    data: {
      name: deck.name + ' (copie)',
      userId: deck.userId,
      format: deck.format,
      colors: deck.colors as any,
      notes: deck.notes ?? null,
      showcasedCardId: null,
      showcasedArt: null,
      // Note: Les cartes ne sont plus créées ici car elles sont maintenant des entités séparées
      // Il faudrait implémenter une logique pour dupliquer les cartes ou les lier au nouveau deck
    },
    select: { id: true, name: true },
  })

  return JSON.parse(JSON.stringify(copy))
}

export async function setShowcasedCardAction(
  deckId: string,
  payload: { cardId?: string; artUrl?: string }
) {
  'use server'
  await assertDeckOwnership(deckId)

  const nextId = payload?.cardId ?? null
  const nextArt = payload?.artUrl ?? null

  const current = await prisma.decklist.findUnique({
    where: { id: deckId },
    select: { showcasedCardId: true },
  })

  // Si on reclique la même carte → on l’enlève
  const shouldUnset =
    current?.showcasedCardId && current.showcasedCardId === nextId

  const updated = await prisma.decklist.update({
    where: { id: deckId },
    data: shouldUnset
      ? { showcasedCardId: null, showcasedArt: null }
      : { showcasedCardId: nextId, showcasedArt: nextArt },
    select: { id: true, showcasedCardId: true, showcasedArt: true },
  })
  return JSON.parse(JSON.stringify(updated))
}

export async function deleteDeckAction(deckId: string) {
  'use server'
  await assertDeckOwnership(deckId)

  // Mettre à jour les cartes pour les retirer du deck
  await prisma.card.updateMany({
    where: { deckId },
    data: { deckId: null, quantity: 0 },
  })

  await prisma.decklist.delete({ where: { id: deckId } })
  return { ok: true }
}
