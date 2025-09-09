// Types d'Interface avec génériques
// ==================================

import { CardRarity } from '../base'

export type SortOption<T = string> =
  | 'name'
  | 'cost'
  | 'rarity'
  | 'type'
  | 'color'
  | 'price'
  | 'set'
  | T

export type FilterState<
  TColor extends string = string,
  TCardType extends string = string,
  TRarity extends string = CardRarity,
> = {
  sortOption: SortOption
  sortOrderAsc: boolean
  searchQuery: string
  selectedColors: TColor[]
  selectedTypes: TCardType[]
  selectedRarities: TRarity[]
  selectedSets: string[]
}
