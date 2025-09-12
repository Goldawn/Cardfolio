'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './WishlistList.module.css'

interface WishlistListProps {
  list: any
  onRename?: (name: string) => void
  onDelete?: (id: string) => void
}

export default function WishlistList({
  list,
  onRename,
  onDelete,
}: WishlistListProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(list.name ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleRename = () => {
    const next = editedName.trim()
    if (!next) return
    if (next !== list.name) onRename?.(next)
    setIsEditing(false)
  }

  const onEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRename()
    } else if (e.key === 'Escape') {
      setEditedName(list.name ?? '')
      setIsEditing(false)
    }
  }

  const uniqueCount = list.items?.length ?? 0
  const totalCount = list.totalQuantity ?? 0

  return (
    <header className={styles.wishlistList}>
      {!isEditing ? (
        <>
          <h3 className={styles.title}>
            {list.name}
            <span className={styles.countBadge}>
              {uniqueCount} uniques • {totalCount} au total
            </span>
          </h3>

          <div className={styles.actions}>
            <button onClick={() => setIsEditing(true)}>Renommer</button>
            <button
              onClick={() => onDelete?.(list.id)}
              className={styles.danger}
            >
              Supprimer
            </button>
          </div>
        </>
      ) : (
        <div className={styles.editContainer}>
          <input
            ref={inputRef}
            type="text"
            value={editedName}
            onChange={e => setEditedName(e.target.value)}
            onKeyDown={onEditKeyDown}
            aria-label="Nouveau nom de la wishlist"
            placeholder="Nom de la liste"
          />
          <button onClick={handleRename}>Valider</button>
          <button
            onClick={() => {
              setIsEditing(false)
              setEditedName(list.name ?? '')
            }}
          >
            Annuler
          </button>
        </div>
      )}
    </header>
  )
}
