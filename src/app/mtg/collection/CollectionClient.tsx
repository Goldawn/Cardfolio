'use client'

import { useEffect, useMemo, useState, Fragment, useTransition } from 'react'
import Link from 'next/link'
import { useCurrencyContext } from '@/context/'
import {
  fetchSets,
  fetchSetCards,
  fetchMoreCards,
} from '../../services/Scryfall'
import { formatCard } from '../../services/FormatCard'
import useCardFilters from '../../hooks/useCardFilters'
import Card from '../../components/Card'
import CollectionActionBar from '../../components/CollectionActionBar'
import Loader from '../../components/Loader'
import { fetchCardPrice } from '../../services/pricing'
import SetBar from '../../components/SetBar' // ✅ intégré
import styles from './page.module.css'
import type { GameCard, Currency } from '@/types'
import type { ScryfallSet, ScryfallCard } from '../../services/Scryfall'
import type { JSX } from 'react'

interface CollectionItem {
  scryfallId: string
  quantity: number
  priceHistory: any[]
  dbId: string
}

interface CollectionActions {
  addToCollection: (scryfallId: string, priceEntry: any) => Promise<any>
  updateCollectionQuantity: (cardId: string, delta: number) => Promise<any>
  removeFromCollection: (cardId: string) => Promise<any>
}

interface CollectionClientProps {
  initialItems: any[]
  actions: CollectionActions
}

export default function CollectionClient({ initialItems, actions }: CollectionClientProps): JSX.Element {
  const { currency } = useCurrencyContext()

  // collection brute (scryfallId, qty, priceHistory, dbId)
  const [collection, setCollection] = useState<CollectionItem[]>(
    (initialItems || []).map((it: any) => ({
      scryfallId: it.scryfallId,
      quantity: it.quantity,
      priceHistory: it.priceHistory || [],
      dbId: it.id,
    }))
  )

  // cartes enrichies avec Scryfall + formatCard (pour l'affichage sans set sélectionné)
  const [enrichedCollection, setEnrichedCollection] = useState<GameCard[]>([])

  // sets & navigation par extension
  const [sets, setSets] = useState<ScryfallSet[]>([])
  const [selectedSet, setSelectedSet] = useState<string | undefined>()
  const [selectedSetCards, setSelectedSetCards] = useState<ScryfallCard[]>([])
  const [nextPage, setNextPage] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)
  const [hideNotOwned, setHideNotOwned] = useState<boolean>(false)

  // charge la liste des sets
  useEffect(() => {
    const loadSets = async () => setSets(await fetchSets())
    loadSets()
  }, [])

  // enrichissement de la collection avec Scryfall
  useEffect(() => {
    const loadEnriched = async () => {
      if (!collection || collection.length === 0) {
        setEnrichedCollection([])
        return
      }
      try {
        const cards = await Promise.all(
          collection.map(async it => {
            const res = await fetch(
              `https://api.scryfall.com/cards/${it.scryfallId}`,
              { cache: 'no-store' }
            )
            const raw = await res.json()
            const formatted = formatCard(raw)
            return {
              ...formatted,
              quantity: it.quantity,
              priceHistory: it.priceHistory || [],
              dbId: it.dbId,
            }
          })
        )
        setEnrichedCollection(cards)
      } catch (e) {
        console.error('Erreur enrichissement Scryfall:', e)
        setEnrichedCollection([])
      }
    }
    loadEnriched()
  }, [collection])

  // charge les cartes d’un set
  useEffect(() => {
    if (!selectedSet) return
    const loadCards = async () => {
      setLoading(true)
      try {
        const data = await fetchSetCards(selectedSet, 'en')
        setSelectedSetCards(data.data)
        setNextPage(data.has_more ? data.next_page : undefined)
      } finally {
        setLoading(false)
      }
    }
    loadCards()
  }, [selectedSet])

  // pagination
  useEffect(() => {
    if (!nextPage) return
    const loadMoreCards = async () => {
      setLoading(true)
      try {
        const data = await fetchMoreCards(nextPage)
        setSelectedSetCards(prev => [...prev, ...data.data])
        setNextPage(data.has_more ? data.next_page : undefined)
      } finally {
        setLoading(false)
      }
    }
    loadMoreCards()
  }, [nextPage])

  const getSetName = (code: string): string =>
    sets.find(s => s.code === code)?.name || 'Nom inconnu'
  const getSetIcon = (code: string): string => sets.find(s => s.code === code)?.icon_svg_uri || ''
  const getSetTotalCards = (code: string): number | null =>
    sets.find(s => s.code === code)?.card_count || null

  const handleSelectedSet = (code: string): void => {
    if (selectedSet === code) {
      setSelectedSet(undefined)
      setSelectedSetCards([])
    } else {
      setSelectedSet(code)
    }
  }

  // --- source à filtrer ---
  const cardsToFilter =
    selectedSetCards.length === 0
      ? enrichedCollection
      : selectedSetCards
          .map(card => {
            const formatted = formatCard(card)
            const owned = collection.find(c => c.scryfallId === formatted.id)
            return {
              ...formatted,
              quantity: owned?.quantity || 0,
              priceHistory: owned?.priceHistory || [],
              dbId: owned?.dbId,
            }
          })
          .filter(card => !hideNotOwned || card.quantity > 0)

  const {
    sortOption,
    setSortOption,
    sortOrderAsc,
    setSortOrderAsc,
    searchQuery,
    setSearchQuery,
    selectedColors,
    toggleColorFilter,
    selectedTypes,
    toggleTypeFilter,
    selectedRarities,
    toggleRarityFilter,
    sortedAndFilteredCards,
  } = useCardFilters(cardsToFilter)

  // --- stats d’affichage (dépendent de la vue) ---
  const collectionStats = useMemo(() => {
    let totalCards = 0
    let totalValue = 0
    const uniqueSets = new Set()
    const uniqueCardsPerSet = {}
    const cardsPerSet: Record<string, number> = {}

    cardsToFilter.forEach(card => {
      totalCards += card.quantity || 0
      if (card.setCode) {
        uniqueSets.add(card.setCode)
        if (!cardsPerSet[card.setCode]) cardsPerSet[card.setCode] = 0
        cardsPerSet[card.setCode] += card.quantity || 0

        if (!(uniqueCardsPerSet as any)[card.setCode])
          (uniqueCardsPerSet as any)[card.setCode] = new Set<string>()
        const set = (uniqueCardsPerSet as any)[card.setCode] as Set<string>
        set.add(card.id)
      }

      let lastPrice =
        card.priceHistory && card.priceHistory.length > 0
          ? parseFloat((card.priceHistory?.at(-1) as any)?.[currency])
          : 0
      if (isNaN(lastPrice)) lastPrice = 0
      totalValue += lastPrice * (card.quantity || 0)
    })

    const uniqueCounts: Record<string, number> = {}
    Object.entries(uniqueCardsPerSet).forEach(([code, set]) => {
      uniqueCounts[code] = (set as Set<string>).size
    })

    return {
      totalCards,
      totalSets: uniqueSets.size,
      totalSetsCodes: [...uniqueSets],
      totalValue: totalValue.toFixed(2),
      cardsPerSet,
      uniqueCardsPerSet: uniqueCounts,
    }
  }, [cardsToFilter, currency])

  // --- index GLOBAL des sets (indépendant des filtres/vue) pour la SetBar ---
  const globalSetStats = useMemo(() => {
    const setCodes = new Set()
    const uniqueBySet = new Map() // setCode -> Set(cardId)
    ;(enrichedCollection || []).forEach(card => {
      const sc = card.setCode
      if (!sc) return
      setCodes.add(sc)
      if (!uniqueBySet.has(sc)) uniqueBySet.set(sc, new Set())
      uniqueBySet.get(sc).add(card.id)
    })
    const uniqueCounts = {}
    uniqueBySet.forEach((set, sc) => {
      (uniqueCounts as any)[sc] = (set as Set<string>).size
    })
    return {
      codes: Array.from(setCodes),
      uniqueCounts,
    }
  }, [enrichedCollection])

  // items pour SetBar
  const setBarItems = useMemo(() => {
    return (globalSetStats.codes || []).map((code: any) => ({
      code,
      name: getSetName(code),
      icon: getSetIcon(code),
      total: getSetTotalCards(code),
      ownedUnique: (globalSetStats.uniqueCounts as any)[code] || 0,
    }))
  }, [globalSetStats, sets])

  // ---------- Actions côté client (Server Actions derrière) ----------
  const [isPending, startTransition] = useTransition()

  const handleAddToCollection = (card: GameCard): void => {
    const scryfallId = card.id
    startTransition(async () => {
      try {
        const { usd, eur } = await fetchCardPrice(card.name)
        const lastPrice = eur || usd || 0
        const currencyKey = eur ? 'eur' : 'usd'
        const newPriceEntry = {
          date: new Date().toISOString().split('T')[0],
          [currencyKey]: lastPrice,
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
                dbId: item.id,
              } as CollectionItem,
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
      } catch (e) {
        console.error('addToCollection error:', e)
      }
    })
  }

  const handleUpdateQuantity = (cardId: string, delta: number): void => {
    startTransition(async () => {
      try {
        const result = await actions.updateCollectionQuantity(cardId, delta)
        if (!result) return

        if (result.kind === 'deleted') {
          setCollection(prev => prev.filter(c => c.scryfallId !== cardId))
          return
        }

        if (result.kind === 'updated' && result.item) {
          setCollection(prev => {
            const idx = prev.findIndex(c => c.scryfallId === cardId)
            if (idx === -1) {
              return [
                ...prev,
                {
                  scryfallId: cardId,
                  quantity: result.item.quantity,
                  priceHistory: [],
                  dbId: result.item.id,
                } as CollectionItem,
              ]
            }
            const copy = [...prev]
            copy[idx] = { ...copy[idx], quantity: result.item.quantity }
            return copy
          })
        }
      } catch (e) {
        console.error('updateCollectionQuantity error:', e)
      }
    })
  }

  const handleRemove = (cardId: string): void => {
    startTransition(async () => {
      try {
        const result = await actions.removeFromCollection(cardId)
        if (result?.kind === 'deleted') {
          setCollection(prev => prev.filter(c => c.scryfallId !== cardId))
        }
      } catch (e) {
        console.error('removeFromCollection error:', e)
      }
    })
  }

  const toggleHideCards = (): void => setHideNotOwned(v => !v)

  return (
    <div id={styles.collectionPage} aria-busy={isPending || loading}>
      <Link className={styles.addCardsBtn} href="/mtg/importer">
        Importer de nouvelles cartes
      </Link>

      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Rechercher une carte..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value.toLowerCase())}
        />
      </div>

      <div className={styles.collectionContainer}>
        <p className={styles.collectionStats}>
          <span>
            <strong>{collectionStats.totalCards}</strong> Cartes
          </span>
          <span>
            <strong>{collectionStats.totalSets}</strong> Extensions
          </span>
          <span>
            <strong>{collectionStats.totalValue}</strong> {currency}
          </span>
          <label htmlFor="hideNotOwned">
            Hide not owned
            <input
              type="checkbox"
              onChange={toggleHideCards}
              name="hideNotOwned"
              id="hideNotOwned"
              checked={hideNotOwned}
            />
          </label>
        </p>

        <SetBar
          items={setBarItems}
          selectedCode={selectedSet}
          onSelect={handleSelectedSet}
          classes={{
            container: styles.setsContainer,
            item: styles.setNames,
            active: styles.active,
          }}
        />

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
          toggleSortOrder={() => setSortOrderAsc(prev => !prev)}
        />

        {loading && <Loader />}

        <div className={styles.cardContainer}>
          {sortedAndFilteredCards.map((card: GameCard, index: number) => (
            <Card
              key={card.id}
              card={card}
              cardList={sortedAndFilteredCards}
              currentIndex={index}
              showName
              showQuantity
              showPrice
              showAddToCollectionButton
              showDeleteButton
              onAddToCollection={() => handleAddToCollection(card)}
              updateQuantity={handleUpdateQuantity}
              onRemove={handleRemove}
              compareWithCollection={Boolean(selectedSet)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
