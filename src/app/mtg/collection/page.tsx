import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/getAuthenticatedUser'
import {
  addToCollectionAction,
  updateCollectionQuantityAction,
  removeFromCollectionAction,
} from '../../actions/CollectionActions'
import CollectionClient from './CollectionClient'
import type { JSX } from 'react'

export default async function CollectionPage(): Promise<JSX.Element> {
  const user = await getAuthenticatedUser()

  if (!user) {
    return <p>Veuillez vous connecter pour accéder à cette page.</p>
  }

  const userId = user.id

  // Récupère (ou crée si vide) la collection par défaut du user
  let def = await prisma.collection.findFirst({
    where: { userId },
    include: { cards: true },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
  })

  if (!def) {
    def = await prisma.collection.create({
      data: { userId, name: 'Main', isDefault: true },
      include: { cards: true },
    })
  }

  const initialItems = JSON.parse(JSON.stringify(def.cards ?? []))

  return (
    <CollectionClient
      initialItems={initialItems}
      actions={{
        addToCollection: addToCollectionAction,
        updateCollectionQuantity: updateCollectionQuantityAction,
        removeFromCollection: removeFromCollectionAction,
      }}
    />
  )
}
