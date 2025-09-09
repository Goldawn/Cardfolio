// Types spécifiques Lorcana
// ==========================

import { BaseCard } from '../base';
import { Collection, Decklist } from '../collections';

export type LorcanaColor =
  | 'Amber'
  | 'Amethyst'
  | 'Emerald'
  | 'Ruby'
  | 'Sapphire'
  | 'Steel';
export type LorcanaCardType =
  | 'Action'
  | 'Action - Song'
  | 'Character'
  | 'Item'
  | 'Location';
export type LorcanaFormat = 'Constructed' | 'Sealed' | 'Draft';

export type LorcanaGameData = {
  cost?: number;
  inkwell?: boolean;
  types?: LorcanaCardType[];
  abilities?: string[];
  strength?: number;
  willpower?: number;
  lore?: number;
  setNumber?: string;
  flavor?: string;
};

export type LorcanaCard = BaseCard<
  LorcanaGameData,
  LorcanaColor,
  LorcanaCardType,
  LorcanaFormat
> & {
  gameType: 'lorcana';
};

export type LorcanaCollection = Collection<'lorcana'>;
export type LorcanaDecklist = Decklist<'lorcana', LorcanaColor, LorcanaFormat>;
