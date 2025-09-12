'use client'
import { splitIntoN } from '@/lib/mtgSorts'

interface MultiColsProps {
  items: any[]
  cols?: number
  render?: (col: any[], index: number) => React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function MultiCols({
  items,
  cols = 2,
  render,
  className,
  style,
}: MultiColsProps) {
  const buckets = splitIntoN(items, cols)
  return (
    <div
      className={className}
      style={{ ...style, gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {buckets.map((col, i) => (
        <div key={i} className="listCol">
          {render ? render(col, i) : col}
        </div>
      ))}
    </div>
  )
}
