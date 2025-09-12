// Fonction helper pour créer une carte typée
// ===========================================

import { BaseCard, GameType } from '../base'

export function createCard<
  TGameData,
  TColor,
  TCardType,
  TFormat,
  TGameType extends GameType,
>(
  _gameType: TGameType,
  data: Omit<BaseCard<TGameData, TColor, TCardType, TFormat>, 'gameType'> & {
    gameType: TGameType
  }
): BaseCard<TGameData, TColor, TCardType, TFormat> & { gameType: TGameType } {
  return data as any
}

// Types utilitaires pour les opérations
export type CardUpdate<T extends BaseCard<any, any, any, any>> = Partial<
  Omit<T, 'id' | 'gameType'>
>
export type CardCreate<T extends BaseCard<any, any, any, any>> = Omit<T, 'id'>

// Types conditionnels pour les fonctionnalités
export type CardWithPrice<T extends BaseCard<any, any, any, any>> = T extends {
  priceHistory: import('../base').PriceHistory[]
}
  ? T
  : T & { priceHistory: import('../base').PriceHistory[] }

// Types pour les événements
export type CardEvent<T extends BaseCard<any, any, any, any>> =
  | { type: 'card_added'; card: T }
  | { type: 'card_removed'; cardId: string }
  | { type: 'card_updated'; card: T }

// Types pour les réponses API
export type ApiResponse<T> = {
  data?: T | undefined
  error?: string | undefined
  loading: boolean
}

export type CollectionState = 'idle' | 'loading' | 'success' | 'error'
