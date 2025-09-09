'use client'
import { fetchCardPrice } from './pricing'
import { formatCard } from './FormatCard'
import type { GameCard } from '@/types'

// Sauvegarder la collection dans le localStorage
export const saveCollection = (collection: GameCard[], card: GameCard): void => {
  localStorage.setItem('mtgCollection', JSON.stringify(collection))
}

// Charger la collection depuis le localStorage
export const loadCollection = (): GameCard[] => {
  const collection = localStorage.getItem('mtgCollection')
  return collection ? JSON.parse(collection) : []
}

// Ajouter une carte à la collection
export const addCardToCollection = async (card: GameCard): Promise<void> => {
  const collection = loadCollection()
  const today = new Date().toISOString().split('T')[0] // Date du jour

  // Vérifier si la carte est déjà dans la collection
  const existingCard = collection.find(item => item.id === card.id)
  if (existingCard) {
    // Si elle existe, augmenter la quantité
    existingCard.quantity = (existingCard.quantity || 0) + 1
  } else {
    // Récupérer le prix actuel de la carte
    const price = await fetchCardPrice(card.name)

    // Formater la carte avec notre fonction standardisée
    // const formattedCard = formatCard(card);
    // console.log("🛠️ Carte formatée avant ajout :", formattedCard);

    // Ajouter l'entrée de prix actuelle
    card.priceHistory = [
      {
        date: today,
        usd: price.usd || 0,
        eur: price.eur || 0,
      },
    ]

    collection.push(card)
  }

  saveCollection(collection, card)
}

export const getLastPrice = (card: GameCard, currency: 'usd' | 'eur'): number => {
  if (!card.priceHistory || card.priceHistory.length === 0) {
    return 0
  }
  return card.priceHistory.slice(-1)[0][currency] || 0
}

export const updateQuantity = (cardId: string, delta: number): void => {
  const collection = loadCollection()
  const updatedCollection = collection.map(card =>
    card.id === cardId
      ? { ...card, quantity: Math.max(1, (card.quantity || 0) + delta) }
      : card
  )
  saveCollection(updatedCollection, {} as GameCard)
}

export const removeCard = (cardId: string): void => {
  const collection = loadCollection()
  const updatedCollection = collection.filter(card => card.id !== cardId)
  saveCollection(updatedCollection, {} as GameCard)
}

export const filterCollection = (collection: GameCard[], filters: any): GameCard[] => {
  // TODO: Implémenter la logique de filtrage
  return collection
}

export const sortCollection = (collection: GameCard[], sortOption: string, sortOrder: 'asc' | 'desc'): GameCard[] => {
  const sortedCollection: GameCard[] = []

  return sortedCollection
}
