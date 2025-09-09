// Types de base pour tous les jeux de cartes
// ================================================

// Types de base
export type GameType =
  | 'magic'
  | 'pokemon'
  | 'lorcana'
  | 'yugioh'
  | 'flesh-and-blood';

export type CardRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'mythic'
  | 'special'
  | 'other';

export type Currency = 'eur' | 'usd';

export type SortOrder = 'asc' | 'desc';

// Structure générique d'une carte avec génériques
export type BaseCard<
  TGameData = any,
  TColor = string,
  TCardType = string,
  TFormat = string,
> = {
  id: string;
  name: string;
  gameType: GameType;
  setCode?: string;
  setName?: string;
  lang?: string;
  quantity?: number;
  addedAt?: string;
  priceHistory?: PriceHistory[];
  rarity?: CardRarity;
  collectorNumber?: string;
  artist?: string;
  legalities?: Record<string, string>;
  image?: CardImages;
  // Données spécifiques au jeu
  gameData: TGameData;
  // Couleurs/éléments du jeu
  colors?: TColor[];
  // Types de cartes du jeu
  cardType?: TCardType;
  // Format du jeu
  format?: TFormat;
};

export type CardImages = {
  small?: string;
  normal?: string;
  large?: string;
  artCrop?: string;
};

export type PriceHistory = {
  date: string;
  usd: number;
  eur: number;
};

// Union type pour toutes les cartes (défini dans utils/guards.ts)

// Helper types pour extraire les types
export type ExtractGameType<T> =
  T extends BaseCard<any, any, any, any> ? T['gameType'] : never;
export type ExtractGameData<T> =
  T extends BaseCard<infer U, any, any, any> ? U : never;
export type ExtractColors<T> =
  T extends BaseCard<any, infer U, any, any> ? U : never;
export type ExtractCardTypes<T> =
  T extends BaseCard<any, any, infer U, any> ? U : never;
export type ExtractFormats<T> =
  T extends BaseCard<any, any, any, infer U> ? U : never;
