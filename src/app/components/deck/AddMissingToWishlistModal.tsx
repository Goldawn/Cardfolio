// components/deck/AddMissingToWishlistModal.jsx
'use client'
import { useMemo, useState } from 'react'
import styles from './AddMissingToWishlistModal.module.css'

interface AddMissingToWishlistModalProps {
  open: boolean
  onClose: (result?: {
    listId: string
    count: number
    created?: boolean
  }) => void
  deck: any
  deckCards: any[]
  collectionItems: any[]
  wishlistLists?: any[]
  actions: any // { createWishlist(name), addManyToWishlist(listId, items) }
}

export default function AddMissingToWishlistModal({
  open,
  onClose,
  deck,
  deckCards,
  collectionItems,
  wishlistLists = [],
  actions, // { createWishlist(name), addManyToWishlist(listId, items) }
}: AddMissingToWishlistModalProps) {
  const missing = useMemo(
    () => computeMissingFromDeck(deckCards, collectionItems),
    [deckCards, collectionItems]
  )
  const [busyId, setBusyId] = useState<string | null>(null)
  const [newListName, setNewListName] = useState(
    `cartes manquantes ${deck?.name || ''}`.trim()
  )

  if (!open) return null

  const addToExisting = async (listId: string) => {
    try {
      setBusyId(listId)
      if (!missing.length) return
      await actions.addManyToWishlist(listId, missing)
      onClose?.({ listId, count: missing.length })
    } finally {
      setBusyId(null)
    }
  }

  const createThenAdd = async () => {
    try {
      setBusyId('create' as string | null)
      const name = (
        newListName || `cartes manquantes ${deck?.name || ''}`
      ).trim()
      const res = await actions.createWishlist(name)
      const listId = res?.list?.id
      if (!listId) return
      if (missing.length) await actions.addManyToWishlist(listId, missing)
      onClose?.({ listId, count: missing.length, created: true })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className={styles.backdrop} onClick={() => onClose?.()}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>
          Ajouter les cartes manquantes à une wishlist
        </h3>

        {!missing.length ? (
          <p>Aucune carte manquante 🎉</p>
        ) : (
          <p>{missing.length} carte(s) manquante(s) détectée(s).</p>
        )}

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Wishlists existantes</div>
          {wishlistLists.length === 0 ? (
            <div className={styles.empty}>Aucune wishlist pour le moment.</div>
          ) : (
            <ul className={styles.list}>
              {wishlistLists.map((wl: any) => (
                <li key={wl.id} className={styles.row}>
                  <span className={styles.name}>{wl.name}</span>
                  <button
                    onClick={() => addToExisting(wl.id)}
                    disabled={busyId !== null || !missing.length}
                  >
                    {busyId === wl.id ? 'Ajout…' : 'Ajouter à cette liste'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.separator} />

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Créer une nouvelle liste</div>
          <div className={styles.createRow}>
            <input
              type="text"
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              placeholder={`cartes manquantes ${deck?.name || ''}`}
              disabled={busyId !== null}
            />
            <button
              onClick={createThenAdd}
              disabled={busyId !== null || !missing.length}
            >
              {busyId === 'create' ? 'Création…' : 'Créer puis ajouter'}
            </button>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={() => onClose?.()}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

// importe cette fonction depuis services
import { computeMissingFromDeck } from '../../services/WishlistMissing'
