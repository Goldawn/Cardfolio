/**
 * DTOs pour les données brutes des APIs externes
 */

// ===== SCRYFALL DTOs =====
export interface ScryfallCardDTO {
  id: string
  name: string
  layout?: string
  set: string
  set_name: string
  lang?: string
  prices?: {
    usd: string | null
    eur: string | null
    tix: string | null
    usd_foil?: string | null
    eur_foil?: string | null
  }
  rarity?: string
  collector_number?: string
  artist?: string
  legalities?: Record<string, string>
  colors?: string[]
  color_identity?: string[]
  mana_cost?: string
  type_line?: string
  oracle_text?: string
  flavor_text?: string
  power?: string
  toughness?: string
  loyalty?: string
  card_faces?: ScryfallCardFaceDTO[]
  image_uris?: {
    small: string
    normal: string
    large: string
    png: string
    art_crop: string
    border_crop: string
  }
  cmc?: number
  edhrec_rank?: number
  hand_modifier?: string
  life_modifier?: string
  produced_mana?: string[]
  related_uris?: {
    gatherer?: string
    tcgplayer_infinite_articles?: string
    tcgplayer_infinite_decks?: string
    edhrec?: string
    mtgtop8?: string
  }
  purchase_uris?: {
    tcgplayer?: string
    cardmarket?: string
    cardhoarder?: string
  }
}

export interface ScryfallCardFaceDTO {
  name?: string
  mana_cost?: string
  type_line?: string
  oracle_text?: string
  power?: string
  toughness?: string
  loyalty?: string
  image_uris?: {
    small: string
    normal: string
    large: string
    png: string
    art_crop: string
    border_crop: string
  }
}

export interface ScryfallSetDTO {
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
  block?: string
  block_code?: string
}

export interface ScryfallSearchResultDTO {
  data: ScryfallCardDTO[]
  has_more: boolean
  next_page?: string
  total_cards: number
}

// ===== MTGGOLDFISH DTOs =====
export interface MTGGoldfishCardDTO {
  id: string
  name: string
  set: string
  set_name: string
  price: {
    usd: number
    eur: number
  }
  rarity: string
  type: string
  mana_cost?: string
  image_url?: string
}

export interface MTGGoldfishSetDTO {
  id: string
  code: string
  name: string
  release_date: string
  card_count: number
}

// ===== TCGPLAYER DTOs =====
export interface TCGPlayerCardDTO {
  productId: number
  name: string
  setName: string
  rarity: string
  marketPrice: number
  lowPrice: number
  midPrice: number
  highPrice: number
  imageUrl?: string
}

export interface TCGPlayerSetDTO {
  setId: number
  name: string
  abbreviation: string
  releaseDate: string
  totalCards: number
}
