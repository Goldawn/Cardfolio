// Types spécifiques Flesh and Blood
// ==================================

import { Card } from '../base'
import { Collection } from '../collections'

export type FleshAndBloodClass =
  | 'Guardian'
  | 'Warrior'
  | 'Ninja'
  | 'Ranger'
  | 'Wizard'
  | 'Mechanologist'
  | 'Assassin'
  | 'Runeblade'
  | 'Brute'
  | 'Illusionist'
  | 'Shapeshifter'
  | 'Merchant'
  | 'Generic'

export type FleshAndBloodCardType =
  | 'Hero'
  | 'Weapon'
  | 'Equipment'
  | 'Action'
  | 'Attack'
  | 'Reaction'
  | 'Instant'
  | 'Token'

export type FleshAndBloodFormat =
  | 'Blitz'
  | 'Classic Constructed'
  | 'Draft'
  | 'Sealed'
  | 'Ultimate Pit Fight'
  | 'Commoner'
  | 'Clash'
  | 'Pro Tour'
  | 'Living Legend'

export type FleshAndBloodGameData = {
  class?: FleshAndBloodClass
  cost?: number
  pitch?: number
  defense?: number
  attack?: number
  life?: number
  intellect?: number
  type?: string
  text?: string
  flavorText?: string
  keywords?: string[]
  subType?: string
  superType?: string
  rarity?: string
  set?: string
  setNumber?: string
  artist?: string
  legalities?: Record<string, string>
  restrictions?: string[]
  banned?: boolean
  suspended?: boolean
  livingLegend?: boolean
}

export type FleshAndBloodCard = Card<
  FleshAndBloodGameData,
  FleshAndBloodClass,
  FleshAndBloodCardType,
  FleshAndBloodFormat
> & {
  gameType: 'flesh-and-blood'
}

export type FleshAndBloodCollection = Collection<'flesh-and-blood'>

export type FleshAndBloodDecklist = {
  id: string
  name: string
  gameType: 'flesh-and-blood'
  format?: FleshAndBloodFormat
  colors?: FleshAndBloodClass[]
  userId: string
  createdAt: Date
  updatedAt: Date
  isLocked?: boolean
  notes?: string
}
