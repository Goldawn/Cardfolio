// Types de Deck avec génériques
// ==============================

import { GameType } from './base'

export type Decklist<
  TGameType extends GameType = GameType,
  TColor = string,
  TFormat = string,
> = {
  id: string
  name: string
  gameType: TGameType
  colors?: TColor[]
  showcasedCardId?: string
  showcasedArt?: string
  format: TFormat
  isLocked: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
  userId: string
  cards: DeckCard[]
}

export type DeckCard = {
  id: string
  cardId: string
  quantity: number
  allocated: number
  deckId: string
}
