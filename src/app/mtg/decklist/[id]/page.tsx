import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/getAuthenticatedUser'
import DeckClient from './DeckClient'
import {
  createWishlistAction,
  addManyToWishlistAction,
} from '../../../actions/WishlistActions'
import {
  addCardToDeckAction,
  updateDeckCardQtyAction,
  removeCardFromDeckAction,
  bulkUpsertDeckCardsAction,
  renameDeckAction,
  setDeckFormatAction,
  setShowcasedCardAction,
  deleteDeckAction,
  toggleDeckLockAction,
  updateDeckNotesAction,
  duplicateDeckAction,
} from '../../../actions/DeckActions'
import type { JSX } from 'react'

interface SingleDeckPageProps {
  params: Promise<{ id: string }>
}

export default async function SingleDeckPage({ params }: SingleDeckPageProps): Promise<JSX.Element> {
  const user = await getAuthenticatedUser()
  if (!user) {
    return <p>Veuillez vous connecter pour accéder à cette page.</p>
  }
  const userId = user.id

  const { id: deckId } = await params

  const wishlistLists = await prisma.wishlistList.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  // Vérifie que le deck appartient au user + récupère ses meta
  const deck = await prisma.decklist.findFirst({
    where: { id: deckId, userId },
    select: {
      id: true,
      name: true,
      showcasedDeckCardId: true,
      showcasedArt: true,
      colors: true,
      format: true,
      isLocked: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!deck) {
    return <p>Deck introuvable ou non autorisé.</p>
  }

  // Récupère les cartes du deck (brut, sans enrichissement Scryfall)
  const deckCards = await prisma.deckCard.findMany({
    where: { deckId },
    select: { id: true, scryfallId: true, quantity: true },
    orderBy: { id: 'asc' },
  })

  // 👇 collection par défaut du user (pour “ajouter depuis la collection”)
  const defaultCollection = await prisma.collection.findFirst({
    where: { userId },
    include: { items: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })

  const userCollectionItems =
    defaultCollection?.items?.map(it => ({
      scryfallId: it.scryfallId,
      quantity: it.quantity,
    })) ?? []

  const initialDeckCards = JSON.parse(JSON.stringify(deckCards))
  const deckMeta = JSON.parse(JSON.stringify(deck))

  return (
    <DeckClient
      deck={deckMeta}
      initialDeckCards={initialDeckCards}
      initialUserCollectionItems={userCollectionItems}
      wishlistLists={wishlistLists}
      actions={{
        addCardToDeck: addCardToDeckAction,
        updateDeckCardQty: updateDeckCardQtyAction,
        removeCardFromDeck: removeCardFromDeckAction,
        bulkUpsertDeckCards: bulkUpsertDeckCardsAction,
        renameDeck: renameDeckAction,
        setDeckFormat: setDeckFormatAction,
        setShowcasedCard: setShowcasedCardAction,
        deleteDeck: deleteDeckAction,
        toggleDeckLock: toggleDeckLockAction,
        updateDeckNotes: updateDeckNotesAction,
        duplicateDeck: duplicateDeckAction,
        createWishlist: createWishlistAction,
        addManyToWishlist: addManyToWishlistAction,
      }}
    />
  )
}
