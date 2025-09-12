'use client'
import { getArtLarge } from '@/lib/mtgCards'
import styles from './DeckCardsTabs.module.css'

interface DeckTileProps {
  card: any
  qty: number
  deckState: any
  editMode: boolean
  isPending: boolean
  setShowcased: (deckCardId: string, artUrl: string) => void
  updateDeckCardQty: (cardId: string, qty: number) => void
  removeCardFromDeck: (cardId: string) => void
  showLegality: boolean
  isProblem: boolean
  onClickShowcase: () => void
}

export default function DeckTile({
  card,
  qty,
  deckState,
  editMode,
  isPending,
  setShowcased,
  updateDeckCardQty,
  removeCardFromDeck,
  showLegality: _showLegality,
  isProblem,
  onClickShowcase: _onClickShowcase,
}: DeckTileProps) {
  const art = getArtLarge(card)
  const isShowcased =
    String(deckState?.showcasedCardId ?? '') ===
    String(card?.deckCardId ?? '')
  const onDec = () => updateDeckCardQty(card.deckCardId, Math.max(0, qty - 1))
  const onInc = () => updateDeckCardQty(card.deckCardId, qty + 1)

  return (
    <li
      className={styles.cardItem}
      style={{
        border: isProblem ? '1px solid #e67e22' : 'none',
        padding: isProblem ? 8 : 0,
      }}
    >
      <button
        className={`${styles.toggleShowcased} ${isShowcased ? styles.showcased : ''}`}
        title={isShowcased ? 'Carte mise en avant' : 'Définir comme showcased'}
        onClick={() =>
          setShowcased(card.deckCardId, card?.image?.artCrop || '')
        }
      >
        {isShowcased ? '★' : '☆'}
      </button>
      <div className={styles.thumb} title={card.name || card.printedName}>
        {art ? (
          <img src={art} alt={card.name || ''} />
        ) : (
          <div className={styles.noArt} />
        )}
        <span className={styles.qtyBadge}>×{qty}</span>
      </div>
      {editMode && (
        <div className={styles.inlineControls}>
          <button onClick={onDec} disabled={isPending || qty <= 1}>
            −1
          </button>
          <button onClick={onInc} disabled={isPending}>
            +1
          </button>
          <button
            onClick={() => removeCardFromDeck(card.deckCardId)}
            disabled={isPending}
            className={styles.danger}
          >
            Supprimer
          </button>
        </div>
      )}
    </li>
  )
}
