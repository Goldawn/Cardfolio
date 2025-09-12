'use client'
import { createPortal } from 'react-dom'
import styles from './DeckCardsTabs.module.css'

interface CardPreviewPopoverProps {
  preview: any
}

export default function CardPreviewPopover({
  preview,
}: CardPreviewPopoverProps) {
  if (!preview?.open || !preview?.url) return null
  return createPortal(
    <div
      className={styles.previewPopover} // garde tes classes existantes
      style={{ top: `${preview.top}px`, left: `${preview.left}px` }}
      aria-hidden="true"
    >
      <div className={styles.previewCard}>
        <img
          className={styles.previewImg}
          src={preview.url}
          alt={preview.name || ''}
        />
      </div>
    </div>,
    document.body
  )
}
