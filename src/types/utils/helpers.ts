// Fonction helper pour créer une carte typée
// ===========================================

import { Card, GameType } from '../base'

export function createCard<
  TGameData,
  TColor,
  TCardType,
  TFormat,
  TGameType extends GameType,
>(
  _gameType: TGameType,
  data: Omit<Card<TGameData, TColor, TCardType, TFormat>, 'gameType'> & {
    gameType: TGameType
  }
): Card<TGameData, TColor, TCardType, TFormat> & { gameType: TGameType } {
  return data as any
}

// Types utilitaires pour les opérations
export type CardUpdate<T extends Card<any, any, any, any>> = Partial<
  Omit<T, 'id' | 'gameType'>
>
export type CardCreate<T extends Card<any, any, any, any>> = Omit<T, 'id'>

// Types conditionnels pour les fonctionnalités
export type CardWithPrice<T extends Card<any, any, any, any>> = T extends {
  priceHistory: import('../base').PriceHistory[]
}
  ? T
  : T & { priceHistory: import('../base').PriceHistory[] }

// Types pour les événements
export type CardEvent<T extends Card<any, any, any, any>> =
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

// Types pour les composants de deck
export type DeckViewType = 'piles' | 'grid' | 'list' | 'compact'
export type DeckSortKey = 'mv' | 'name' | 'type' | 'color'

export type DeckCard<T = any> = Card<any, any, any, any> & {
  deckCardId: string
  decklistQuantity: number
} & T

export type DeckSection<T = any> = {
  key: string
  title: string
  items: DeckCard<T>[]
}

export type DeckSectionResult<T = any> = {
  sections: DeckSection<T>[]
  lands: DeckCard<T>[]
}

// Types pour les métadonnées d'affichage
export type SectionMeta = {
  label: string
  icon?: string | null
}

// Types pour les handlers de cartes
export type DeckCardHandlers<T = any> = {
  updateDeckCardQty: (deckCardId: string, qty: number) => void
  removeCardFromDeck: (deckCardId: string) => void
  setShowcased: (deckCardId: string, artUrl: string) => void
  isCardProblematic?: (card: DeckCard<T>) => boolean
}

// Types pour les props communes des vues
export type BaseViewProps<T = any> = {
  cards: DeckCard<T>[]
  deckState: any
  isPending: boolean
  legality: any
  editMode: boolean
  showLegality: boolean
  sortKey: DeckSortKey
} & DeckCardHandlers<T>

// Helpers pour les calculs de deck
export const calculateSectionTotal = <T = any>(cards: DeckCard<T>[]): number =>
  cards.reduce((sum, card) => sum + Number(card.decklistQuantity || 0), 0)

export const getSectionMeta = (
  key: string,
  title: string,
  typeMeta: Record<string, SectionMeta>,
  colorMeta: Record<string, SectionMeta>
): SectionMeta => {
  if (key.startsWith('type-')) {
    return typeMeta[title] || { label: title, icon: null }
  }
  if (key.startsWith('color-')) {
    return (
      colorMeta[title] ||
      (title === 'M'
        ? { label: 'Multicolore', icon: null }
        : { label: title, icon: null })
    )
  }
  return { label: title, icon: null }
}

export const createSectionWithLands = <T = any>(
  sections: DeckSection<T>[],
  lands: DeckCard<T>[],
  landsTitle = 'Terrains'
): DeckSection<T>[] => [
  ...sections,
  ...(lands.length ? [{ key: 'lands', title: landsTitle, items: lands }] : []),
]

// Helper pour convertir les sections génériques en DeckSection
export const convertToDeckSections = <T = any>(result: {
  sections: Array<{ key: string; title: string; items: any[] }>
  lands: any[]
}): DeckSectionResult<T> => ({
  sections: result.sections.map(sec => ({
    key: sec.key,
    title: sec.title,
    items: sec.items as DeckCard<T>[],
  })),
  lands: result.lands as DeckCard<T>[],
})

// Helper pour créer les props communes des composants de cartes
export const createCardProps = <T = any>(
  card: DeckCard<T>,
  deckState: any,
  editMode: boolean,
  isPending: boolean,
  showLegality: boolean,
  handlers: DeckCardHandlers<T>,
  problems: any[] = []
) => ({
  card,
  qty: Number(card.decklistQuantity || 0),
  deckState,
  editMode,
  isPending,
  showLegality,
  isProblem: showLegality && problems.length > 0,
  problems,
  ...handlers,
})
