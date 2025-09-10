import axios, { type AxiosResponse } from 'axios'

interface ScryfallCardPrice {
  prices: {
    usd: string | null
    eur: string | null
  }
}

interface PriceData {
  usd: number
  eur: number
}

export const fetchCardPrice = async (cardName: string): Promise<PriceData> => {
  try {
    const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`
    const response: AxiosResponse<ScryfallCardPrice> = await axios.get(url)

    // Extraire les prix en USD et EUR (TCGPlayer)
    const priceUSD = response.data.prices.usd
    const priceEUR = response.data.prices.eur

    return {
      usd: priceUSD ? parseFloat(priceUSD) : 0,
      eur: priceEUR ? parseFloat(priceEUR) : 0,
    }
  } catch (error) {
    console.error(
      'Erreur lors de la récupération du prix depuis Scryfall :',
      error
    )
    return { usd: 0, eur: 0 }
  }
}
