// Types de Statistiques avec génériques
// ======================================

import { CardRarity } from '../base';

export type ManaCurveData<TCost = string> = {
  cost: TCost;
  count: number;
};

export type ManaCurveSplitData<TCost = string> = {
  cost: TCost;
  creatures: number;
  nonCreatures: number;
};

export type ColorDistributionData<TColor = string> = {
  key: TColor;
  value: number;
};

export type ColorDistribution<TColor = string> = {
  data: ColorDistributionData<TColor>[];
  total: number;
};

export type CollectionStats<
  TColor extends string = string,
  TCardType extends string = string,
  TRarity extends string = CardRarity,
> = {
  totalCards: number;
  totalValue: number;
  byRarity: Record<TRarity, number>;
  byColor: Record<TColor, number>;
  byType: Record<TCardType, number>;
  bySet: Record<string, number>;
};
