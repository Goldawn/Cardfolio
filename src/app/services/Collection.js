'use client'
import { fetchCardPrice } from './pricing.js'
import { formatCard } from './FormatCard.js'

// Sauvegarder la collection dans le localStorage
export const saveCollection = (collection, card) => {
  localStorage.setItem('mtgCollection', JSON.stringify(collection))
}

// Charger la collection depuis le localStorage
export const loadCollection = () => {
  const collection = localStorage.getItem('mtgCollection')
  return collection ? JSON.parse(collection) : []
}

// Ajouter une carte à la collection
export const addCardToCollection = async card => {
  const collection = loadCollection()
  const today = new Date().toISOString().split('T')[0] // Date du jour

  // Vérifier si la carte est déjà dans la collection
  const existingCard = collection.find(item => item.id === card.id)
  if (existingCard) {
    // Si elle existe, augmenter la quantité
    existingCard.quantity += 1
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

export const getLastPrice = (card, currency) => {
  if (!card.priceHistory || card.priceHistory.length === 0) {
    return 0
  }
  return card.priceHistory.slice(-1)[0][currency] || 0
}

export const updateQuantity = (cardId, delta) => {
  const collection = loadCollection()
  const updatedCollection = collection.map(card =>
    card.id === cardId
      ? { ...card, quantity: Math.max(1, card.quantity + delta) }
      : card
  )
  saveCollection(updatedCollection)
}

export const removeCard = cardId => {
  const updatedCollection = collection.filter(card => card.id !== cardId)
  saveCollection(updatedCollection)
}

export const filterCollection = (collection, filters) => {
  const filteredCollection = collection.filter

  return filteredCollection
}

export const sortCollection = (collection, sortOption, sortOrder) => {
  const sortedCollection = []

  return sortedCollection
}
