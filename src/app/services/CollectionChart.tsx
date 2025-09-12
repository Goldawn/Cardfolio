'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import styles from './CollectionChart.module.css'
import type { GameCard } from '@/types'
import type { JSX } from 'react'

interface CollectionHistoryPoint {
  date: string
  totalValue: string
}

interface CollectionChartProps {
  collection: GameCard[]
  currency: 'eur' | 'usd'
}

const generateCollectionValueHistory = (collection: GameCard[], currency: 'eur' | 'usd'): CollectionHistoryPoint[] => {
  const historyMap = new Map<string, number>()

  collection.forEach(card => {
    card.priceHistory?.forEach(({ date, eur, usd }) => {
      const price = currency === 'eur' ? parseFloat(String(eur)) : parseFloat(String(usd))
      const totalValueForCard = price * (card.quantity || 0)

      if (!historyMap.has(date)) {
        historyMap.set(date, 0)
      }
      historyMap.set(date, historyMap.get(date)! + totalValueForCard)
    })
  })

  return Array.from(historyMap.entries()).map(([date, totalValue]) => ({
    date,
    totalValue: totalValue.toFixed(2),
  }))
}

export default function CollectionChart({ collection, currency }: CollectionChartProps): JSX.Element {
  const [collectionHistory, setCollectionHistory] = useState<CollectionHistoryPoint[]>([])

  useEffect(() => {
    setCollectionHistory(generateCollectionValueHistory(collection, currency))
  }, [collection, currency])

  return (
    <div className={styles.collectionChart}>
      <ResponsiveContainer width="80%" height={300}>
        <LineChart data={collectionHistory}>
          <XAxis dataKey="date" />
          <YAxis
            domain={[0, Number(collectionHistory.at(-1)?.totalValue) + 1]}
          />
          <Tooltip />
          <Line type="monotone" dataKey="totalValue" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
