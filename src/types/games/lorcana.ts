// Types spécifiques Lorcana
// ==========================

import { Collection } from '../collections'

export type LorcanaColor =
  | 'Amber'
  | 'Amethyst'
  | 'Emerald'
  | 'Ruby'
  | 'Sapphire'
  | 'Steel'
export type LorcanaCardType =
  | 'Action'
  | 'Action - Song'
  | 'Character'
  | 'Item'
  | 'Location'
export type LorcanaFormat = 'Constructed' | 'Sealed' | 'Draft'

export type LorcanaGameData = {
  cost?: number
  inkwell?: boolean
  types?: LorcanaCardType[]
  abilities?: string[]
  strength?: number
  willpower?: number
  lore?: number
  setNumber?: string
  flavor?: string
}

export type LorcanaCard = BaseCard<
  LorcanaGameData,
  LorcanaColor,
  LorcanaCardType,
  LorcanaFormat
> & {
  gameType: 'lorcana'
}

export type LorcanaCollection = Collection<'lorcana'>

export type LorcanaDecklist = {
  id: string
  name: string
  gameType: 'lorcana'
  format?: LorcanaFormat
  colors?: LorcanaColor[]
  userId: string
  createdAt: Date
  updatedAt: Date
  isLocked?: boolean
  notes?: string
}
