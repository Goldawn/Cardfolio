import axios, { type AxiosResponse } from 'axios'

const BASE = 'https://api.scryfall.com'

export interface ScryfallSet {
  id: string
  code: string
  name: string
  released_at: string
  set_type: string
  card_count: number
  digital: boolean
  foil_only: boolean
  nonfoil_only: boolean
  icon_svg_uri: string
  parent_set_code?: string
}

export interface ScryfallCard {
  id: string
  name: string
  set: string
  set_name: string
  lang: string
  prices: {
    usd: string | null
    eur: string | null
  }
  [key: string]: any
}

interface ScryfallResponse {
  data: ScryfallCard[]
  has_more: boolean
  next_page?: string
  total_cards: number
}

export const fetchSets = async (): Promise<ScryfallSet[]> => {
  try {
    const response: AxiosResponse<{ data: ScryfallSet[] }> = await axios.get('https://api.scryfall.com/sets')
    return response.data.data // Liste de tous les sets
  } catch (error) {
    console.error('Error fetching sets:', error)
    return []
  }
}

export const fetchSetCards = async (setCode: string, lang: string = 'en'): Promise<ScryfallResponse> => {
  try {
    const response: AxiosResponse<ScryfallResponse> = await axios.get(
      `https://api.scryfall.com/cards/search?order=set&q=set%3A${setCode}+lang%3A${lang}&unique=prints`
    )
    return response.data
  } catch (error) {
    console.error('Error fetching cards:', error)
    return { data: [], has_more: false, total_cards: 0 }
  }
}

export const fetchMoreCards = async (nextPage: string): Promise<ScryfallResponse> => {
  try {
    const response: AxiosResponse<ScryfallResponse> = await axios.get(nextPage)
    return response.data
  } catch (error) {
    console.error('Error fetching more cards:', error)
    return { data: [], has_more: false, total_cards: 0 }
  }
}
