'use client'

interface MasonryProps {
  cols?: number
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

export default function Masonry({
  cols = 2,
  className,
  style,
  children,
}: MasonryProps) {
  return (
    <div
      className={className}
      style={{ ...style, gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {children}
    </div>
  )
}
