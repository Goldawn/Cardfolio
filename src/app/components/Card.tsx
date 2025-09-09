'use client'

import { useState } from 'react'
import styles from './Card.module.css'
import CardModal from './CardModal'
import SplitButton from './SplitButton'
import type { GameCard, Currency } from '@/types'
import type { WishlistList } from '@/types/collections'
import type { JSX } from 'react'

interface CardProps {
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

export default function Card({
  card,
  wishlistLists = [],
  currency = 'eur',
  className = '',
  cardList,
  currentIndex,

  // Features (flags)
  showName = true,
  showSet = false,
  showQuantity = false,
  showWishlistQuantity = false,
  showDecklistQuantity = false,
  showPrice = false,
  showAddToCollectionButton = false,
  showAddToWishlistButton = false,
  showAddToDeckButton = false,
  showDeleteButton = false,
  compareWithCollection = false,
  modal = true,
  disabled = false,

  // Actions (callbacks)
  onAddToCollection,
  onCreateWishlist,
  onAddToWishlist,
  onAddToDeck,
  onRemove,
  updateQuantity,
  undoAddToCollection,
}: CardProps): JSX.Element {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getLastPrice = (card: GameCard, currency: Currency): number => {
    if (!card.priceHistory || card.priceHistory.length === 0) return 0
    return card.priceHistory.slice(-1)[0][currency] || 0
  }

  const cardName = card.name?.split(' // ')[0] || 'Nom inconnu'
  const lastPrice = getLastPrice(card, currency)
  const totalValue = (lastPrice * (card.quantity || 1)).toFixed(2)

  const handleOpenModal = (e: React.MouseEvent) => {
    // e.stopPropagation();                 // <-- évite de déclencher undoAdd
    if (!modal || disabled) return
    setIsModalOpen(true)
  }

  const handleCloseModal = (): void => setIsModalOpen(false)

  const handleRootClick = (): void => {
    if (disabled) return
    if (undoAddToCollection) {
      undoAddToCollection(card)
    }
  }

  const stop = (e: React.MouseEvent) => e.stopPropagation()
  const isOwned = (card.quantity || 0) > 0
  const cardClass = compareWithCollection && !isOwned ? styles.notOwned : ''

  // Default list: si tu as un flag "isDefault" sur tes listes, privilégie-le ici
  const defaultListId =
    wishlistLists.find(l => l.isDefault)?.id ?? wishlistLists[0]?.id

  return (
    <div className={`${styles.card} ${className}`} onClick={handleRootClick}>
      <img
        className={`${cardClass}`}
        src={card.image?.small || card.image?.normal || '/placeholder.png'} // <-- fallback
        alt={cardName}
        onClick={handleOpenModal}
      />

      {showName && <h3>{cardName}</h3>}
      {showSet && card.setCode && (
        <p className={styles.set}>{card.setCode.toUpperCase()}</p>
      )}

      {/* Affichage du bouton d'ajout à la collection */}
      <div className={styles.cardButtonContainer} onClick={stop}>
        {showAddToCollectionButton && onAddToCollection && !isOwned && (
          <button
            className={styles.addCollectionButton}
            onClick={() => onAddToCollection(card)}
            disabled={disabled}
          >
            Ajouter
          </button>
        )}

        {showAddToWishlistButton && onAddToWishlist && (
          <SplitButton
            lists={wishlistLists || []}
            defaultListId={defaultListId}
            onQuickAdd={listId => onAddToWishlist(listId, card)}
            onCreateWishlist={onCreateWishlist}
            card={card}
          />
        )}

        {showAddToDeckButton && onAddToDeck && (
          <button
            className={styles.wishlistButton}
            title="Ajouter au deck"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()
              onAddToDeck(card)
            }}
            disabled={disabled}
          >
            Ajouter au deck
          </button>
        )}
      </div>

      {showQuantity && <p>Dans la collection : {card.quantity || 0}</p>}
      {showWishlistQuantity && (
        <p>Dans la wishlist : {(card as any).wishlistQuantity || 0}</p>
      )}
      {showDecklistQuantity && (
        <p>Dans la decklist : {(card as any).decklistQuantity || 0}</p>
      )}

      {showPrice && (
        <>
          <p>
            Prix unitaire : {Number(lastPrice).toFixed(2)}{' '}
            {currency === 'eur' ? '€' : '$'}
          </p>
          <p>
            Valeur totale : {totalValue} {currency === 'eur' ? '€' : '$'}
          </p>
        </>
      )}

      {/* Affichage du bouton de mise à jour de la quantité */}
      {updateQuantity && isOwned && (
        <div className={styles.actionBox} onClick={stop}>
          <div className={styles.quantityBtnBox}>
            <button
              className={styles.remove}
              onClick={() => updateQuantity(card.id, -1)}
              disabled={disabled || (card.quantity || 0) <= 1}
            >
              -1
            </button>
            <button
              className={styles.add}
              onClick={() => updateQuantity(card.id, 1)}
              disabled={disabled}
            >
              +1
            </button>
          </div>
        </div>
      )}

      {/* Affichage du bouton de suppression de la collection */}
      {showDeleteButton && onRemove && isOwned && (
        <button
          className={styles.delete}
          onClick={() => onRemove(card.id)}
          disabled={disabled}
          title="Supprimer de la collection"
        >
          Supprimer
        </button>
      )}

      {modal && isModalOpen && (
        <CardModal
          card={card}
          onClose={handleCloseModal}
          cardList={cardList}
          currentIndex={currentIndex}
        />
      )}
    </div>
  )
}
