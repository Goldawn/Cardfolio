// Type guard functions
// ====================

import { Card, GameType } from '../base'
import { FleshAndBloodCard } from '../games/flesh-and-blood'
import { LorcanaCard } from '../games/lorcana'
import { MTGCard } from '../games/magic'
import { PokemonCard } from '../games/pokemon'
import { YugiohCard } from '../games/yugioh'

// Union type pour toutes les cartes
export type GameCard =
  | MTGCard
  | PokemonCard
  | LorcanaCard
  | YugiohCard
  | FleshAndBloodCard

export function isGameCard<T extends GameType>(
  card: any,
  gameType: T
): card is Card<any, any, any, any> & { gameType: T } {
  return card?.gameType === gameType
}

export function isMTGCard(card: GameCard): card is MTGCard {
  return card.gameType === 'magic'
}

export function isPokemonCard(card: GameCard): card is PokemonCard {
  return card.gameType === 'pokemon'
}

export function isLorcanaCard(card: GameCard): card is LorcanaCard {
  return card.gameType === 'lorcana'
}

export function isYugiohCard(card: GameCard): card is YugiohCard {
  return card.gameType === 'yugioh'
}

export function isFleshAndBloodCard(card: GameCard): card is FleshAndBloodCard {
  return card.gameType === 'flesh-and-blood'
}
