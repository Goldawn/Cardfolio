/**
 * Service de pricing pour les cartes
 * Fournit des fonctions pour récupérer les prix des cartes
 */

export interface PriceData {
  usd?: number
  eur?: number
  tix?: number
}

/**
 * Récupère le prix d'une carte par son nom
 * TODO: Implémenter la logique de récupération des prix depuis une API
 */
export const fetchCardPrice = async (cardName: string): Promise<PriceData> => {
  // Pour l'instant, retourner des prix fictifs
  // TODO: Intégrer avec une vraie API de pricing (TCGPlayer, MTGGoldfish, etc.)
  console.log(`Fetching price for card: ${cardName}`)

  return {
    usd: Math.random() * 100, // Prix fictif entre 0 et 100 USD
    eur: Math.random() * 90, // Prix fictif entre 0 et 90 EUR
    tix: Math.random() * 10, // Prix fictif entre 0 et 10 tix
  }
}

/**
 * Récupère l'historique des prix d'une carte
 * TODO: Implémenter la logique de récupération de l'historique
 */
export const fetchCardPriceHistory = async (
  cardName: string
): Promise<PriceData[]> => {
  // Pour l'instant, retourner un historique fictif
  console.log(`Fetching price history for card: ${cardName}`)

  const today = new Date()
  const history: PriceData[] = []

  // Générer 30 jours d'historique fictif
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    history.push({
      usd: Math.random() * 100,
      eur: Math.random() * 90,
      tix: Math.random() * 10,
    })
  }

  return history
}
