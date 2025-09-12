// Types spécifiques Magic: The Gathering
// ======================================

import { BaseCard, CardImages } from '../base'
import { Collection } from '../collections'
import { Decklist } from '../decks'

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
  manaCost?: string | undefined
  manaValue?: number | undefined
  cmc?: number | undefined
  convertedManaCost?: number | undefined
  type?: string | undefined
  typeLine?: string | undefined
  oracleText?: string | undefined
  flavorText?: string | undefined
  power?: string | undefined
  toughness?: string | undefined
  colorIdentity?: MTGColor[] | undefined
  card_faces?: MTGCardFace[] | undefined
}

export type MTGCardFace = {
  name?: string | undefined
  mana_cost?: string | undefined
  type_line?: string | undefined
  oracle_text?: string | undefined
  power?: string | undefined
  toughness?: string | undefined
  image_uris?: CardImages | undefined
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
