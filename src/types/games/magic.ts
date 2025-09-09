// Types spécifiques Magic: The Gathering
// ======================================

import { BaseCard, CardImages } from '../base'
import { Collection, Decklist } from '../collections'

export type MTGColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C' | 'M'
export type MTGCardType =
  | 'creature'
  | 'instant'
  | 'sorcery'
  | 'enchantment'
  | 'artifact'
  | 'planeswalker'
  | 'battle'
  | 'land'
  | 'other'
export type MTGFormat =
  | 'commander'
  | 'standard'
  | 'modern'
  | 'legacy'
  | 'vintage'
  | 'pioneer'
  | 'historic'
  | 'brawl'
  | 'oathbreaker'
  | 'gladiator'
  | 'paupercommander'
  | 'standardbrawl'
  | 'timeless'
  | 'alchemy'
  | 'penny'

export type MTGGameData = {
  manaCost?: string
  manaValue?: number
  cmc?: number
  convertedManaCost?: number
  type?: string
  typeLine?: string
  oracleText?: string
  flavorText?: string
  power?: string
  toughness?: string
  colorIdentity?: MTGColor[]
  card_faces?: MTGCardFace[]
}

export type MTGCardFace = {
  name?: string
  mana_cost?: string
  type_line?: string
  oracle_text?: string
  power?: string
  toughness?: string
  image_uris?: CardImages
}

export type MTGCard = BaseCard<
  MTGGameData,
  MTGColor,
  MTGCardType,
  MTGFormat
> & {
  gameType: 'magic'
}

export type MTGCollection = Collection<'magic'>
export type MTGDecklist = Decklist<'magic', MTGColor, MTGFormat>
