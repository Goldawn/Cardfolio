// Types spécifiques Yu-Gi-Oh!
// ============================

import { Card } from '../base'
import { Collection } from '../collections'

export type YugiohAttribute =
  | 'DARK'
  | 'DIVINE'
  | 'EARTH'
  | 'FIRE'
  | 'LIGHT'
  | 'WATER'
  | 'WIND'

export type YugiohCardType = 'Monster' | 'Spell' | 'Trap'

export type YugiohMonsterType =
  | 'Aqua'
  | 'Beast'
  | 'Beast-Warrior'
  | 'Creator-God'
  | 'Cyberse'
  | 'Dinosaur'
  | 'Divine-Beast'
  | 'Dragon'
  | 'Fairy'
  | 'Fiend'
  | 'Fish'
  | 'Insect'
  | 'Machine'
  | 'Plant'
  | 'Psychic'
  | 'Pyro'
  | 'Reptile'
  | 'Rock'
  | 'Sea Serpent'
  | 'Spellcaster'
  | 'Thunder'
  | 'Warrior'
  | 'Winged Beast'
  | 'Wyrm'
  | 'Zombie'

export type YugiohFormat =
  | 'Advanced'
  | 'Traditional'
  | 'Speed Duel'
  | 'Rush Duel'

export type YugiohGameData = {
  attribute?: YugiohAttribute
  level?: number
  rank?: number
  linkRating?: number
  monsterType?: YugiohMonsterType
  type?: string
  atk?: number
  def?: number
  linkMarkers?: string[]
  pendulumScale?: number
  pendulumEffect?: string
  effect?: string
  flavorText?: string
  archetype?: string
  materials?: string
  fusionMaterials?: string
  ritualSpell?: string
  ritualMonster?: string
  xyzMaterials?: string
  linkMaterials?: string
  synchroMaterials?: string
  tuner?: boolean
  nonTuner?: string
  spellType?: string
  trapType?: string
  property?: string
}

export type YugiohCard = Card<
  YugiohGameData,
  YugiohAttribute,
  YugiohCardType,
  YugiohFormat
> & {
  gameType: 'yugioh'
}

export type YugiohCollection = Collection<'yugioh'>

export type YugiohDecklist = {
  id: string
  name: string
  gameType: 'yugioh'
  format?: YugiohFormat
  colors?: YugiohAttribute[]
  userId: string
  createdAt: Date
  updatedAt: Date
  isLocked?: boolean
  notes?: string
}
