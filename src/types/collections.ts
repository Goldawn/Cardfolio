// Types de Collection avec génériques
// ====================================

import { GameType } from './base';

export type Collection<TGameType extends GameType = GameType> = {
  id: string;
  name: string;
  gameType: TGameType;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  items: CollectionItem[];
};

export type CollectionItem = {
  id: string;
  cardId: string; // ID générique de la carte
  quantity: number;
  dateAdded: Date;
  updatedAt: Date;
  priceHistory: import('./base').PriceHistory[];
  collectionId: string;
};

export type WishlistList<TGameType extends GameType = GameType> = {
  id: string;
  name: string;
  gameType: TGameType;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  items: WishlistItem[];
};

export type WishlistItem = {
  id: string;
  cardId: string;
  quantity: number;
  dateAdded: Date;
  updatedAt: Date;
  wishlistId: string;
};

export type CollectionChangeLog<TGameType extends GameType = GameType> = {
  id: string;
  userId: string;
  cardId: string;
  gameType: TGameType;
  changeType: 'add' | 'remove' | 'update';
  quantity: number;
  totalAfter: number;
  changedAt: Date;
};
