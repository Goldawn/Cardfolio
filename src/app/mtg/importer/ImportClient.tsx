'use client'

import { useEffect, useState, useMemo, Fragment, useTransition } from 'react'
import {
  fetchSets,
  fetchSetCards,
  fetchMoreCards,
} from '../../services/Scryfall'
import Card from '../../components/Card'
import Loader from '../../components/Loader'
import { fetchCardPrice } from '../../services/pricing'
import useCardFilters from '../../hooks/useCardFilters'
import CollectionActionBar from '../../components/CollectionActionBar'
import styles from './page.module.css'
import type { JSX } from 'react'
import type { GameCard } from '@/types'
import type { GameSet } from '@/card-api-service/dto'
import type { MTGCard } from '@/types/games/magic'

interface ImportClientProps {
  initialCollection: any[]
  initialWishlistLists: any[]
  actions: any
  userId: string
}

export default function ImportClient({
  initialCollection,
  initialWishlistLists,
  actions,
  userId,
}: ImportClientProps): JSX.Element {
  const [sets, setSets] = useState<GameSet[]>([])
  const [filteredSets, setFilteredSets] = useState<GameSet[]>([])
  const [selectedSet, setSelectedSet] = useState<GameSet>({
    id: '',
    name: '',
    code: '',
    cardCount: 0,
    releaseDate: '',
    setType: '',
    digital: false,
    iconUri: '',
  })

  const [cards, setCards] = useState<MTGCard[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [displaySetList, setDisplaySetList] = useState<boolean>(false)
  const [nextPage, setNextPage] = useState<string | undefined>(undefined)
  // const [recentlyAddedToCollection, setRecentlyAddedToCollection] = useState([]);

  // [{ id: scryfallId, card, count }]
  const [recentlyAdded, setRecentlyAdded] = useState<Array<{ id: string; card: any; count: number }>>([])

  const [isReduced, setIsReduced] = useState<boolean>(false)
  const [isPending, startTransition] = useTransition()

  // ✅ wishlists (source de vérité)
  const [wishlistLists, setWishlistLists] = useState<any[]>(initialWishlistLists || [])

  // ✅ état collection local (simplifié)
  const [collection, setCollection] = useState<Array<{
    scryfallId: string
    quantity: number
    priceHistory: any[]
  }>>(
    (initialCollection || []).map((c: any) => ({
      scryfallId: c.scryfallId,
      quantity: c.quantity,
      priceHistory: c.priceHistory,
    }))
  )

  // ✅ totaux wishlist par scryfallId (toutes listes)
  const wishlistTotals = useMemo(() => {
    const map = new Map<string, number>()
    ;(wishlistLists || []).forEach((list: any) => {
      ;(list.items || []).forEach((it: any) => {
        const prev = map.get(it.scryfallId) || 0
        map.set(it.scryfallId, prev + (it.quantity || 0))
      })
    })
    return map
  }, [wishlistLists])

  // Les cartes sont déjà formatées par le service
  const formattedCards = cards
  const enrichedCards = formattedCards.map((card: GameCard) => {
    const owned = collection.find(c => c.scryfallId === card.id)
    const totalWished = wishlistTotals.get(card.id) || 0
    return {
      ...card,
      quantity: owned?.quantity || 0,
      wishlistQuantity: totalWished,
    }
  })

  const {
    sortedAndFilteredCards,
    selectedColors,
    toggleColorFilter,
    selectedTypes,
    toggleTypeFilter,
    selectedRarities,
    toggleRarityFilter,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    sortOrderAsc,
    setSortOrderAsc,
  } = useCardFilters(enrichedCards)

  // ---- Sets Scryfall ----
  useEffect(() => {
    const loadSets = async () => {
      const allSets = await fetchSets()
      setSets(allSets)
    }
    loadSets()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const query = e.target.value.toLowerCase()
    if (query.length > 2) {
      const matchingSets = sets.filter((set: GameSet) =>
        set.name.toLowerCase().includes(query)
      )

      const structuredSets: GameSet[] = []
      const parentSets = matchingSets.filter((set: GameSet) => !set.parentSetCode)
      const subSets = matchingSets.filter((set: GameSet) => set.parentSetCode)

      parentSets.forEach((parent: GameSet) => {
        structuredSets.push(parent)
        subSets
          .filter((sub: GameSet) => sub.parentSetCode === parent.code)
          .forEach((sub: GameSet) => structuredSets.push(sub))
      })

      subSets
        .filter(
          (sub: GameSet) => !parentSets.some((parent: GameSet) => parent.code === sub.parentSetCode)
        )
        .forEach((sub: GameSet) => structuredSets.push(sub))

      setFilteredSets(structuredSets)
    }
    setDisplaySetList(false)
  }

  useEffect(() => {
    setDisplaySetList(filteredSets.length > 0)
  }, [filteredSets])

  const handleSetSelect = (set: GameSet): void => {
    setSelectedSet({ ...set })
    setDisplaySetList(false)
  }

  useEffect(() => {
    const loadCards = async () => {
      if (!selectedSet.code) return
      setLoading(true)
      try {
        const cardsData = await fetchSetCards(selectedSet.code, 'en')
        setCards(cardsData.data)
        if (cardsData.has_more) setNextPage(cardsData.next_page)
        else setNextPage(undefined)
      } finally {
        setLoading(false)
      }
    }
    loadCards()
  }, [selectedSet])

  useEffect(() => {
    if (!nextPage) return
    const loadMoreCards = async () => {
      setLoading(true)
      try {
        const moreCardsData = await fetchMoreCards(nextPage)
        setCards(prev => [...prev, ...moreCardsData.data])
        if (moreCardsData.has_more) setNextPage(moreCardsData.next_page)
        else setNextPage(undefined)
      } finally {
        setLoading(false)
      }
    }
    loadMoreCards()
  }, [nextPage])

  const bumpRecent = (card: any, delta: number): void => {
    if (!card?.id || !delta) return
    setRecentlyAdded(prev => {
      const idx = prev.findIndex(e => e.id === card.id)
      if (delta > 0) {
        if (idx === -1) {
          return [{ id: card.id, card, count: delta }, ...prev]
        }
        const copy = [...prev]
        copy[idx] = { ...copy[idx], count: copy[idx].count + delta }
        return copy
      } else {
        if (idx === -1) return prev
        const nextCount = prev[idx].count + delta
        if (nextCount <= 0) {
          const copy = [...prev]
          copy.splice(idx, 1)
          return copy
        }
        const copy = [...prev]
        copy[idx] = { ...copy[idx], count: nextCount }
        return copy
      }
    })
  }

  const handleRecentCardClick = (cardId: string): void => {
    const cardObj = formattedCards.find(c => c.id === cardId) || { id: cardId }
    startTransition(async () => {
      try {
        const result = await actions.updateCollectionQuantity(cardId, -1)
        if (!result) return

        if (result.kind === 'deleted') {
          setCollection(prev => prev.filter(c => c.scryfallId !== cardId))
        } else if (result.kind === 'updated' && result.item) {
          setCollection(prev =>
            prev.map(c =>
              c.scryfallId === cardId
                ? { ...c, quantity: result.item.quantity }
                : c
            )
          )
        }

        // décrémente le compteur “récemment ajouté”
        bumpRecent(cardObj, -1)
      } catch (err) {
        console.error('Erreur recent click (-1) :', err)
      }
    })
  }

  // ---- Collection (Server Actions) ----
  const handleAddToCollection = (card: any): void => {
    const scryfallId = card.id

    startTransition(async () => {
      try {
        const { usd, eur } = await fetchCardPrice(card.name)

        console.log('import eur, usd', eur, usd)
        const lastPrice = eur || eur || 0
        // { date: '2025-09-10', eur: 1.0, usd: 1.0 }
        const currency = eur ? 'eur' : 'usd'
        const newPriceEntry = {
          date: new Date().toISOString().split('T')[0],
          usd: usd,
          eur: eur,
        }

        const result = await actions.addToCollection(scryfallId, newPriceEntry)
        const { item } = result || {}
        if (!item) return

        setCollection(prev => {
          const idx = prev.findIndex(c => c.scryfallId === scryfallId)
          if (idx === -1) {
            return [
              ...prev,
              {
                scryfallId,
                quantity: item.quantity,
                priceHistory: item.priceHistory || [newPriceEntry],
              },
            ]
          }
          const copy = [...prev]
          copy[idx] = {
            ...copy[idx],
            quantity: item.quantity,
            priceHistory: item.priceHistory || copy[idx].priceHistory,
          }
          return copy
        })

        bumpRecent(card, 1)
      } catch (err) {
        console.error('Erreur addToCollection (server action) :', err)
      }
    })
  }

  // ---- Met à jour la quantité d'une carte dans la collection (Server Action) ----
  const handleUpdateQuantity = (cardId: string, delta: number): void => {
    startTransition(async () => {
      try {
        const result = await actions.updateCollectionQuantity(cardId, delta)
        if (!result) return

        if (result.kind === 'deleted') {
          setCollection(prev => prev.filter(c => c.scryfallId !== cardId))
          setRecentlyAdded(prev => prev.filter(e => e.id !== cardId))
          return
        }

        if (result.kind === 'updated' && result.item) {
          setCollection(prev => {
            const idx = prev.findIndex(c => c.scryfallId === cardId)
            if (idx === -1) {
              // si on n'avait pas l'item localement (cas delta > 0 sur item inexistant)
              return [
                ...prev,
                {
                  scryfallId: cardId,
                  quantity: result.item.quantity,
                  priceHistory: [],
                },
              ]
            }
            const copy = [...prev]
            copy[idx] = { ...copy[idx], quantity: result.item.quantity }
            return copy
          })
        }

        // si on ajoute, on incrémente le compteur "récemment ajouté"
        const cardObj = formattedCards.find(c => c.id === cardId) || {
          id: cardId,
        }
        if (delta > 0) {
          bumpRecent(cardObj, delta)
        } else if (delta < 0) {
          bumpRecent(cardObj, delta)
        }
      } catch (err) {
        console.error('Erreur updateCollectionQuantity (server action) :', err)
      }
    })
  }

  // ---- Wishlist (Server Action) ----
  const handleCreateWishlist = async (name = 'wishlist') => {
    try {
      const res = await actions.createWishlist(name) // doit retourner { list: { id, name, items: [] } } ou au moins { id, name }
      const { list } = res || {}
      if (!list?.id) return null

      setWishlistLists(prev => {
        const exists = prev.some(l => l.id === list.id)
        if (exists) return prev
        // s’assurer que list.items existe
        return [...prev, { ...list, items: list.items ?? [] }]
      })
      return list.id
    } catch (e) {
      console.error('Erreur createWishlist:', e)
      return null
    }
  }

  const handleAddToWishlist = (listId: string, card: any): void => {
    if (!listId) return // aucune liste dispo
    startTransition(async () => {
      try {
        const result = await actions.addToWishlist(listId, card.id, 1)
        const { item } = result || {}
        if (!item) return

        setWishlistLists(prev =>
          prev.map(list => {
            if (list.id !== listId) return list
            const idx = list.items.findIndex((it: any) => it.scryfallId === card.id)
            if (idx === -1) {
              return {
                ...list,
                items: [
                  ...list.items,
                  { id: item.id, scryfallId: card.id, quantity: item.quantity },
                ],
              }
            }
            const newItems = [...list.items]
            newItems[idx] = { ...newItems[idx], quantity: item.quantity }
            return { ...list, items: newItems }
          })
        )
      } catch (err) {
        console.error('Erreur addToWishlist (server action) :', err)
      }
    })
  }

  // --- suppression de tous les exemplaires d'une carte de la collection ---
  const handleRemoveFromCollection = (cardId: string): void => {
    const card = formattedCards.find(c => c.id === cardId)
    if (!card) return

    startTransition(async () => {
      try {
        const result = await actions.removeFromCollection(cardId)
        if (result?.kind === 'deleted') {
          // ✅ Supprime la carte de la collection
          setCollection(prev => prev.filter(c => c.scryfallId !== cardId))
          // ✅ Supprime aussi la carte de l'aside récemment ajouté
          setRecentlyAdded(prev => prev.filter(e => e.id !== cardId))
        }
      } catch (err) {
        console.error('Erreur removeFromCollection (server action) :', err)
      }
    })
  }

  const toggleSortOrder = () => setSortOrderAsc(prev => !prev)

  return (
    <div id={styles.importPage} aria-busy={isPending || loading}>
      <h1 id={styles.top}>Magic: The Gathering</h1>

      <div className={styles.inputContainer}>
        <input
          type="text"
          placeholder="Recherchez un set..."
          onChange={handleInputChange}
        />
        {displaySetList && (
          <ul id={styles.scrollbar}>
            {filteredSets.map((set: GameSet) => (
              <li
                key={set.code}
                className={set.parentSetCode ? styles.subSet : ''}
                onClick={() => handleSetSelect(set)}
              >
                <img src={set.iconUri} alt={set.name} />
                <strong
                  className={!set.parentSetCode ? styles.expansion : ''}
                >
                  {set.name}
                </strong>{' '}
                ({set.code}) ({set.cardCount} cartes) <i>{set.releaseDate}</i>
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading && <Loader />}

      {selectedSet.name && (
        <>
          <div className={styles.setHeaderInputContainer}>
            <div className={styles.setHeader}>
              <img
                className={styles.setIcon}
                src={selectedSet.iconUri}
                alt={selectedSet.name}
              />
              <div className={styles.setDetails}>
                <h2>
                  {selectedSet.name} ({selectedSet.code})
                </h2>
                <p>
                  {selectedSet.cardCount} cartes | sortie le{' '}
                  {selectedSet.releaseDate}
                </p>
              </div>
            </div>

            <input
              type="text"
              placeholder="Rechercher une carte..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <CollectionActionBar
            selectedColors={selectedColors}
            toggleColorFilter={toggleColorFilter}
            selectedTypes={selectedTypes}
            toggleTypeFilter={toggleTypeFilter}
            selectedRarities={selectedRarities}
            toggleRarityFilter={toggleRarityFilter}
            sortOption={sortOption}
            setSortOption={setSortOption}
            sortOrderAsc={sortOrderAsc}
            toggleSortOrder={toggleSortOrder}
          />

          <div id={styles.cardContainer}>
            {sortedAndFilteredCards.map((card, index) => (
              <Fragment key={`${card.id}-${index}`}>
                <Card
                  key={card.id}
                  card={card}
                  cardList={sortedAndFilteredCards}
                  currentIndex={index}
                  showName
                  showQuantity
                  showWishlistQuantity
                  showAddToCollectionButton
                  showAddToWishlistButton
                  showDeleteButton
                  updateQuantity={handleUpdateQuantity}
                  wishlistLists={wishlistLists}
                  onAddToCollection={() => handleAddToCollection(card)}
                  onCreateWishlist={handleCreateWishlist}
                  onAddToWishlist={async (listId: string, card: GameCard) => handleAddToWishlist(listId, card)}
                  onRemove={handleRemoveFromCollection}
                  disabled={isPending}
                />
              </Fragment>
            ))}
          </div>
        </>
      )}

      {recentlyAdded.length > 0 && (
        <aside
          className={`${styles.recentlyImportedCards} ${isReduced ? styles.reduced : ''} ${
            recentlyAdded.length > 0 ? styles.show : ''
          }`}
        >
          <div className={styles.recentlyAddedHeader}>
            <h3>Cartes récemment ajoutées</h3>
            <div
              className={styles.reduceSection}
              onClick={() => setIsReduced(!isReduced)}
            >
              {isReduced ? '⏶' : '⏷'}
            </div>
          </div>
          <div className={styles.cardContainer}>
            {recentlyAdded.map(({ id, card, count }: { id: string; card: any; count: number }, index: number) => (
              <div
                key={`${id}-${index}`}
                onClick={() => handleRecentCardClick(id)} // 👈 clique = -1
                style={{ cursor: 'pointer' }}
              >
                <Card
                  card={card}
                  cardList={recentlyAdded.map(e => e.card)}
                  currentIndex={index}
                  // hasOtherFace={(card as any).layout !== 'normal'}
                  className={index === 0 ? styles.cardAppear : ''}
                  showName={false}
                  modal={false}
                />
                <p>
                  récemment ajouté : <strong>{count}</strong>
                </p>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  )
}
