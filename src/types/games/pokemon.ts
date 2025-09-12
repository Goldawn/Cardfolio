// Types spécifiques Pokemon
// ==========================

import { Collection } from '../collections'

export type PokemonType =
  | 'Grass'
  | 'Fire'
  | 'Water'
  | 'Lightning'
  | 'Psychic'
  | 'Fighting'
  | 'Darkness'
  | 'Metal'
  | 'Fairy'
  | 'Dragon'
  | 'Colorless'
export type PokemonCardType = 'Pokémon' | 'Trainer' | 'Energy'
export type PokemonFormat = 'Standard' | 'Expanded' | 'Legacy' | 'Unlimited'

export type PokemonGameData = {
  hp?: number
  types?: PokemonType[]
  weaknesses?: PokemonWeakness[]
  resistances?: PokemonResistance[]
  retreatCost?: number
  attacks?: PokemonAttack[]
  abilities?: PokemonAbility[]
  stage?:
    | 'Basic'
    | 'Stage 1'
    | 'Stage 2'
    | 'BREAK'
    | 'Level-Up'
    | 'MEGA'
    | 'EX'
    | 'GX'
    | 'V'
    | 'VMAX'
    | 'VSTAR'
  evolvesFrom?: string
  evolvesTo?: string[]
}

export type PokemonWeakness = {
  type: PokemonType
  value: string
}

export type PokemonResistance = {
  type: PokemonType
  value: string
}

export type PokemonAttack = {
  name: string
  cost: PokemonType[]
  damage?: string
  text?: string
}

export type PokemonAbility = {
  name: string
  text: string
  type: 'Pokémon Power' | 'Poké-Body' | 'Poké-Power' | 'Ability'
}

export type PokemonCard = BaseCard<
  PokemonGameData,
  PokemonType,
  PokemonCardType,
  PokemonFormat
> & {
  gameType: 'pokemon'
}

export type PokemonCollection = Collection<'pokemon'>

export type PokemonDecklist = {
  id: string
  name: string
  gameType: 'pokemon'
  format?: PokemonFormat
  colors?: PokemonType[]
  userId: string
  createdAt: Date
  updatedAt: Date
  isLocked?: boolean
  notes?: string
}
