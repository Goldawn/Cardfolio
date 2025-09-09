'use client'

import { useEffect, useState } from 'react'
import styles from './CollectionStats.module.css'
import type { GameCard } from '@/types'
import type { JSX } from 'react'

const calculateCollectionStats = (collection: GameCard[], currency: 'eur' | 'usd') => {
  let totalCards = 0
  let totalValue = 0

  collection.forEach(card => {
    totalCards += card.quantity || 0
    const lastPrice =
      card.priceHistory && card.priceHistory.length > 0
        ? parseFloat(card.priceHistory.at(-1)?.[currency]?.toString() || '0')
        : 0
    totalValue += lastPrice * (card.quantity || 0)
  })

  return { totalCards, totalValue: totalValue.toFixed(2) }
}

interface CollectionStatsProps {
  collection: GameCard[]
  currency: 'eur' | 'usd'
}

export default function CollectionStats({ collection, currency }: CollectionStatsProps): JSX.Element {
  const [summary, setSummary] = useState({ totalCards: 0, totalValue: '0' })

  useEffect(() => {
    setSummary(calculateCollectionStats(collection, currency))
  }, [collection, currency])

  return (
    <div className={styles.collectionStats}>
      <p>
        <strong>Nombre total de cartes :</strong> {summary.totalCards}
      </p>
      <p>
        <strong>Valeur actuelle :</strong> {summary.totalValue}{' '}
        {currency === 'eur' ? '€' : '$'}
      </p>
    </div>
  )
}
