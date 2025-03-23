import axios from 'axios';

export const fetchCardPrice = async (cardName) => {
  try {
    const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`;
    const response = await axios.get(url);

    // Extraire les prix en USD et EUR (TCGPlayer)
    const priceUSD = response.data.prices.usd;
    const priceEUR = response.data.prices.eur;

    return {
      usd: priceUSD || 0,
      eur: priceEUR || 0,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération du prix depuis Scryfall :", error);
    return { usd: 0, eur: 0 };
  }
};