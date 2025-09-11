'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import WishlistSearchSection from '../../components/WishlistSearchSection'
import MagicCardPlaceholder from '../../components/MagicCardPlaceholder'
import WishlistList from '../../components/WishlistList'
import Card from '../../components/Card'
import { formatCard } from '@/app/services/FormatCard'
import { cardApiManager } from '@/app/services/CardApiManager'
import styles from './page.module.css'
import type { GameCard } from '@/types'
import type { JSX } from 'react'

interface WishlistList {
  id: string
  name: string
  [key: string]: any
}

export default function WishlistPage(): JSX.Element {
  const { data: session, status } = useSession()
  const cardService = cardApiManager.getCardService()
  const [lists, setLists] = useState<WishlistList[]>([])
  const [cardsByList, setCardsByList] = useState<Record<string, GameCard[]>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [newListName, setNewListName] = useState<string>('')
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [hoveredCardImageByList, setHoveredCardImageByList] = useState<Record<string, string>>({})

  const userId: string | undefined = session?.user?.id

  const fetchWishlistLists = async (): Promise<void> => {
    if (!userId) return
    try {
      const res = await fetch(`/api/users/${userId}/wishlist/lists`)
      const data = await res.json()
      setLists(data)
    } catch (error) {
      console.error('Erreur chargement listes de souhait :', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchWishlistLists()
    }
  }, [userId, status])

  useEffect(() => {
    const fetchAllCards = async () => {
      if (!userId || lists.length === 0) return

      const allCards: Record<string, GameCard[]> = {}

      await Promise.all(
        lists.map(async list => {
          try {
            const res = await fetch(
              `/api/users/${userId}/wishlist/lists/${list.id}/items`
            )
            const items = await res.json()

            const enriched = await Promise.all(
              items.map(async (item: any) => {
                const formatted = await cardService.fetchCard({ cardId: item.scryfallId })
                return {
                  ...formatted,
                  wishlistQuantity: item.quantity,
                  wishlistItemId: item.id,
                }
              })
            )

            allCards[list.id] = enriched
          } catch (error) {
            console.error(
              `Erreur chargement cartes de la liste ${list.name} :`,
              error
            )
            allCards[list.id] = []
          }
        })
      )

      setCardsByList(allCards)
    }

    fetchAllCards()
  }, [lists, userId])

  const handleCreateList = async (): Promise<void> => {
    if (!newListName.trim()) return
    try {
      const res = await fetch(`/api/users/${userId}/wishlist/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName }),
      })
      const createdList = await res.json()
      setLists(prev => [createdList, ...prev])
      setNewListName('')
    } catch (error) {
      console.error('❌ Erreur création liste :', error)
    }
  }

  const handleRenameList = async (listId: string, newName: string): Promise<void> => {
    try {
      const res = await fetch(`/api/users/${userId}/wishlist/lists`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId, name: newName }),
      })
      const updated = await res.json()
      setLists(prev =>
        prev.map(list =>
          list.id === listId ? { ...list, name: updated.name } : list
        )
      )
    } catch (err) {
      console.error('Erreur renommage liste :', err)
    }
  }

  const handleDeleteList = async (listId: string): Promise<void> => {
    if (!confirm('Supprimer cette liste ?')) return
    try {
      await fetch(`/api/users/${userId}/wishlist/lists`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId }),
      })
      setLists(prev => prev.filter(list => list.id !== listId))
    } catch (err) {
      console.error('Erreur suppression liste :', err)
    }
  }

  const handleOpenAddCard = (listId: string): void => setActiveListId(listId)

  const handleCloseAddCard = (): void => {
    setActiveListId(null)
    setHoveredCardImageByList({})
  }

  const handleHoverCard = (listId: string, imageUrl: string): void => {
    setHoveredCardImageByList(prev => ({ ...prev, [listId]: imageUrl }))
  }

  const removeCard = async (wishlistId: string, cardId: string): Promise<void> => {
    if (!cardId || !wishlistId) return
    try {
      const res = await fetch(
        `/api/users/${userId}/wishlist/lists/${wishlistId}/items`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scryfallId: cardId }),
        }
      )
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      fetchWishlistLists()
    } catch (err) {
      console.error('Erreur removeCard :', err)
    }
  }

  const updateQuantity = async (wishlistId: string, cardId: string, delta: number): Promise<void> => {
    if (!cardId || !wishlistId) return
    try {
      const res = await fetch(
        `/api/users/${userId}/wishlist/lists/${wishlistId}/items`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scryfallId: cardId, quantityDelta: delta }),
        }
      )
      if (!res.ok) throw new Error('Erreur lors de la modification')
      fetchWishlistLists()
    } catch (err) {
      console.error('Erreur updateQuantity :', err)
    }
  }

  if (status === 'loading') return <p>Chargement de la session...</p>
  if (status === 'unauthenticated') return <p>Veuillez vous connecter.</p>

  return (
    <div className={styles.wishlistPage}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Ma Wishlist</h1>

        <div className={styles.newListForm}>
          <input
            type="text"
            placeholder="Nom de la nouvelle liste"
            value={newListName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewListName(e.target.value)}
          />
          <button onClick={handleCreateList}>➕ Créer la liste</button>
        </div>
      </div>

      {loading && <p>Chargement des listes...</p>}
      {!loading && lists.length === 0 && <p>Aucune liste pour le moment.</p>}

      {!loading && lists.length > 0 && (
        <div className={styles.listsContainer}>
          {lists.map((list: WishlistList) => (
            <section key={list.id} className={styles.wishlistSection}>
              <WishlistList
                list={list}
                onRename={(newName: string) => handleRenameList(list.id, newName)}
                onDelete={() => handleDeleteList(list.id)}
              />

              <div className={styles.cardGrid}>
                {(cardsByList[list.id] || []).map((card: GameCard, index: number) => (
                  <Card
                    key={card.id}
                    // listId={list.id}
                    card={card}
                    currentIndex={index}
                    cardList={cardsByList[list.id]}
                    showName
                    modal
                    showWishlistQuantity
                    showDeleteButton
                    onRemove={cardId => removeCard(list.id, cardId)}
                    // editableQuantity
                    updateQuantity={(cardId, delta) =>
                      updateQuantity(list.id, cardId, delta)
                    }
                  />
                ))}

                <div
                  className={`${styles.addCardTile} ${
                    activeListId === list.id ? styles.active : ''
                  }`}
                >
                  <MagicCardPlaceholder
                    test={() => handleOpenAddCard(list.id)}
                    image={hoveredCardImageByList[list.id]}
                  />

                  {activeListId === list.id && userId && (
                    <WishlistSearchSection
                      userId={userId}
                      wishlistLists={lists}
                      StopAddingToWishlist={handleCloseAddCard}
                      wishlistId={list.id}
                      onHoverCard={(imageUrl: string) =>
                        handleHoverCard(list.id, imageUrl)
                      }
                      onCardAdded={fetchWishlistLists}
                    />
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
