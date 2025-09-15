'use client'

import { useCurrencyContext } from '@/context/'
import type { GameCard, PriceHistory } from '@/types'
import { isMTGCard } from '@/types/utils/guards'
import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatAndParseText } from '../../lib/mtgCards'
import useModalKeyboardNavigation from '../hooks/useModalKeyboardNavigation'
import styles from './CardModal.module.css'

// Helper pour obtenir l'URL d'image d'une carte
const getCardImageUrl = (card: GameCard): string =>
  card.imageLarge || card.imageNormal || card.imageSmall || ''

interface CardModalProps {
  card: GameCard
  onClose: () => void
  cardList?: GameCard[] | undefined
  currentIndex?: number | undefined
}

export default function CardModal({
  card,
  onClose,
  cardList = [],
  currentIndex = 0,
}: CardModalProps): JSX.Element {
  const [flipped, setFlipped] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(currentIndex)
  const currentCard = cardList[currentCardIndex] || card

  const { currency, toggleCurrency } = useCurrencyContext()

  const handleNextCard = (): void => {
    if (currentCardIndex < cardList.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setFlipped(false)
    }
  }

  const handlePreviousCard = (): void => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setFlipped(false)
    }
  }

  useModalKeyboardNavigation({
    isOpen: true,
    onClose,
    onNext: handleNextCard,
    onPrev: handlePreviousCard,
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  const isFrontAndBack = ['flip', 'transform', 'modal_dfc'].includes(
    (currentCard as any).layout
  )
  const isDualFaceLayout = ['split', 'adventure', 'reversible_card'].includes(
    (currentCard as any).layout
  )

  const displayedCard = useMemo(() => {
    if (isFrontAndBack && flipped) return (currentCard as any).cardBack
    return currentCard
  }, [currentCard, flipped])

  const formattedPriceHistory = useMemo(() => {
    if (!currentCard.priceHistory || currentCard.priceHistory.length === 0)
      return []

    return currentCard.priceHistory
      .map((entry: PriceHistory) => ({
        date: entry.date,
        eur: entry.eur,
        usd: entry.usd,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [currentCard])

  const getCurrentImage = (): string => {
    if ((currentCard as any).layout === 'reversible_card') {
      return flipped
        ? (currentCard as any).reversibleImage?.large ||
            getCardImageUrl(currentCard)
        : getCardImageUrl(currentCard)
    }
    return getCardImageUrl(currentCard)
  }

  const renderCardFace = (cardData: GameCard) => {
    const { gameData, colors } = cardData

    return (
      <>
        <h2>{cardData.name}</h2>
        {isMTGCard(cardData) && (gameData as any)?.manaCost && (
          <p>
            <strong>Coût de mana :</strong>{' '}
            {formatAndParseText((gameData as any).manaCost)}
          </p>
        )}
        <p>
          <strong>Type :</strong>{' '}
          {isMTGCard(cardData)
            ? (gameData as any)?.typeLine || (gameData as any)?.type || 'N/A'
            : 'N/A'}
        </p>
        {isMTGCard(cardData) &&
          (gameData as any)?.power &&
          (gameData as any)?.toughness && (
            <p>
              <strong>Statistiques :</strong> {(gameData as any).power}/
              {(gameData as any).toughness}
            </p>
          )}
        {(gameData as any)?.loyalty && (
          <p>
            <strong>Points de loyauté :</strong> {(gameData as any).loyalty}
          </p>
        )}
        {isMTGCard(cardData) && (gameData as any)?.oracleText && (
          <p>
            <strong>Description :</strong>{' '}
            {formatAndParseText((gameData as any).oracleText)}
          </p>
        )}
        {isMTGCard(cardData) && (gameData as any)?.flavorText && (
          <p>
            <em>{formatAndParseText((gameData as any).flavorText)}</em>
          </p>
        )}
        {colors && colors.length > 0 && (
          <p>
            <strong>Couleurs :</strong> {colors.join(', ')}
          </p>
        )}
      </>
    )
  }

  return (
    <div
      className={styles.overlay}
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>

        {cardList.length > 1 && (
          <div className={styles.navButtons}>
            <button
              onClick={handlePreviousCard}
              disabled={currentCardIndex === 0}
            >
              ← {cardList[currentCardIndex - 1]?.name}
            </button>
            Carte {currentCardIndex + 1} / {cardList.length}
            <button
              onClick={handleNextCard}
              disabled={currentCardIndex === cardList.length - 1}
            >
              {cardList[currentCardIndex + 1]?.name} →
            </button>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.cardQuantityPanel}>
            {isFrontAndBack ||
            (currentCard as any).layout === 'reversible_card' ? (
              <div
                key={currentCard.id}
                className={`${styles.cardContainer} ${styles.cardTransition}`}
              >
                <div
                  className={`${styles.card} ${flipped ? styles.flipped : ''}`}
                >
                  <div
                    className={styles.cardFace}
                    style={{
                      backgroundImage: `url(${getCardImageUrl(currentCard)})`,
                    }}
                  >
                    <button
                      className={styles.flipButton}
                      onClick={() => setFlipped(true)}
                    >
                      Voir le verso
                    </button>
                  </div>
                  <div
                    className={styles.cardFace}
                    style={{
                      backgroundImage: `url(${(currentCard as any).reversibleImage?.large || (currentCard as any).cardBack?.imageLarge || (currentCard as any).cardBack?.imageNormal})`,
                    }}
                  >
                    <button
                      className={styles.flipButton}
                      onClick={() => setFlipped(false)}
                    >
                      Voir le recto
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                key={currentCard.id}
                className={`${styles.imageContainer} ${styles.cardTransition}`}
              >
                <img
                  src={getCurrentImage()}
                  alt={currentCard.name}
                  className={styles.image}
                />
              </div>
            )}

            <div className={styles.quantityBox}>
              <p>Exemplaires possédés</p>
              <button>Ajouter un exemplaire</button>
              <button>Supprimer un exemplaire</button>
            </div>
          </div>

          <div className={styles.details}>
            {renderCardFace(displayedCard)}

            <p>
              <strong>Rareté :</strong> {currentCard.rarity || 'N/A'}
            </p>
            <p>
              <strong>Set:</strong> {currentCard.setName || 'N/A'} (
              {currentCard.setCode || 'N/A'})
            </p>
            <p>
              <strong>Numéro de collection :</strong>{' '}
              {currentCard.collectorNumber || 'N/A'}
            </p>

            {isDualFaceLayout && (currentCard as any).cardBack && (
              <>
                <p>---------------------------------------------------------</p>
                {renderCardFace((currentCard as any).cardBack)}
              </>
            )}

            <p>---------------------------------------------------------</p>
            <p>
              <strong>Formats légaux :</strong>
            </p>
            <ul className={styles.legalities}>
              {Object.entries(currentCard.legalities || {})
                .filter(([_, legality]) => legality === 'legal')
                .map(([format]) => (
                  <li key={format}>{format}</li>
                ))}
            </ul>
            <p>
              <strong>Illustrateur :</strong> {currentCard.artist || 'N/A'}
            </p>
          </div>

          <div className={styles.tradingPanel}>
            {currentCard.priceHistory &&
              currentCard.priceHistory.map((price: PriceHistory) => (
                <p key={price.date}>
                  <strong>{price.date} :</strong>{' '}
                  {currency === 'eur' ? price.eur : price.usd}{' '}
                  {currency === 'eur' ? '€' : '$'}
                </p>
              ))}
            <button className={styles.update} onClick={toggleCurrency}>
              Afficher en {currency === 'eur' ? 'USD $' : 'EUR €'}
            </button>
            <p>Prix moyen 30 jours :</p>
            <p>Prix moyen 7 jours :</p>
            <ResponsiveContainer width="100%" aspect={16 / 9}>
              <LineChart width={500} height={300} data={formattedPriceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" padding={{ left: 30, right: 30 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={currency}
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
