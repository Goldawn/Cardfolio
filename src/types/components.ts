// Types pour les composants React
// ===============================

import type { GameCard, Currency, AppCollectionItem, AppDeckCard } from './index'
import type { WishlistList } from './collections'

// Types de base pour les composants
export type ComponentProps = {
  className?: string
  disabled?: boolean
  loading?: boolean
}

// Types pour les composants de cartes
export type CardProps = {
  card: GameCard
  wishlistLists?: WishlistList[]
  currency?: Currency
  className?: string
  cardList?: GameCard[]
  currentIndex?: number

  // Features (flags)
  showName?: boolean
  showSet?: boolean
  showQuantity?: boolean
  showWishlistQuantity?: boolean
  showDecklistQuantity?: boolean
  showPrice?: boolean
  showAddToCollectionButton?: boolean
  showAddToWishlistButton?: boolean
  showAddToDeckButton?: boolean
  showDeleteButton?: boolean
  compareWithCollection?: boolean
  modal?: boolean
  disabled?: boolean

  // Actions (callbacks)
  onAddToCollection?: (card: GameCard) => void
  onCreateWishlist?: (name: string) => Promise<string | null>
  onAddToWishlist?: (listId: string, card: GameCard) => Promise<void>
  onAddToDeck?: (card: GameCard) => void
  onRemove?: (cardId: string) => void
  updateQuantity?: (cardId: string, delta: number) => void
  undoAddToCollection?: (card: GameCard) => void
}

// Types pour les barres d'actions de collection
export type CollectionActionBarProps = {
  selectedColors: string[]
  toggleColorFilter: (color: string) => void
  selectedTypes: string[]
  toggleTypeFilter: (type: string) => void
  selectedRarities: string[]
  toggleRarityFilter: (rarity: string) => void
  sortOption: string
  setSortOption: (option: string) => void
  sortOrderAsc: boolean
  toggleSortOrder: () => void
}

// Types pour les composants de deck
export type DeckComponentProps = {
  deckId: string
  deckName?: string
  format?: string
  cards?: AppDeckCard[]
  onCardAdd?: (cardId: string, quantity: number) => void
  onCardRemove?: (cardId: string) => void
  onCardUpdate?: (cardId: string, quantity: number) => void
}

// Types pour les composants de collection
export type CollectionComponentProps = {
  items: AppCollectionItem[]
  onItemAdd?: (item: AppCollectionItem) => void
  onItemUpdate?: (item: AppCollectionItem) => void
  onItemRemove?: (itemId: string) => void
  onBulkUpdate?: (items: AppCollectionItem[]) => void
}

// Types pour les modales
export type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'small' | 'medium' | 'large' | 'full'
  children: React.ReactNode
}

// Types pour les boutons
export type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

// Types pour les inputs
export type InputProps = {
  type?: 'text' | 'number' | 'email' | 'password' | 'search'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  required?: boolean
}

// Types pour les selects
export type SelectProps<T = string> = {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string; disabled?: boolean }>
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  multiple?: boolean
}
