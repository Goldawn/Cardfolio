import axios from 'axios';

export const fetchSets = async () => {
  try {
    const response = await axios.get('https://api.scryfall.com/sets');
    return response.data.data; // Liste de tous les sets
  } catch (error) {
    console.error('Error fetching sets:', error);
    return [];
  }
};

export const fetchSetCards = async (setCode, lang = 'en') => {
    try {
      const response = await axios.get(
        `https://api.scryfall.com/cards/search?order=set&q=set%3A${setCode}+lang%3A${lang}&unique=prints`
        // `https://api.scryfall.com/cards/search?order=set&q=set%3A${setCode}+lang%3A${lang}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
};

export const fetchMoreCards = async (nextPage) => {
    try {
      const response = await axios.get(nextPage);
      return response.data;
    } catch (error) {
      console.error('Error fetching more cards:', error);
      return [];
    }
};

export const apiTest = async () => {
  const response = await fetch('http://localhost:3000/api');
  return response.json();
}