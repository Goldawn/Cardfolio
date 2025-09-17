'use client'

import { useCurrencyContext } from '@/context/'
import { prisma } from '@/lib/prisma'
import type { AppCollectionItem, CollectionActions } from '@/types'
import type { GameCard } from '@/types/utils/guards'
import Link from 'next/link'
import type { JSX } from 'react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import Card from '../../components/Card'
import CollectionActionBar from '../../components/CollectionActionBar'
import Loader from '../../components/Loader'
import SetBar from '../../components/SetBar'
import useCardFilters from '../../hooks/useCardFilters'
// Services supprimés - utiliser Prisma directement
import styles from './page.module.css'

interface CollectionClientProps {
  initialItems: any[]
  actions: CollectionActions
}

export default function CollectionClient({
  initialItems,
  actions,
}: CollectionClientProps): JSX.Element {
  const { currency } = useCurrencyContext()

  // collection brute (externalId, qty, priceHistory, dbId)
  const [collection, setCollection] = useState<AppCollectionItem[]>(
    (initialItems || []).map((it: any) => ({
      externalId: it.externalId,
      quantity: it.quantity,
      priceHistory: it.priceHistory || [],
      dbId: it.id,
    }))
  )

  // cartes enrichies avec Scryfall + formatCard (pour l'affichage sans set sélectionné)
  const [enrichedCollection, setEnrichedCollection] = useState<GameCard[]>([])

  // sets & navigation par extension
  const [sets, setSets] = useState<any[]>([])
  const [selectedSet, setSelectedSet] = useState<string | undefined>()
  const [selectedSetCards, setSelectedSetCards] = useState<GameCard[]>([])
  const [nextPage, setNextPage] = useState<string | undefined>()
  const [loading, setLoading] = useState<boolean>(false)
  const [hideNotOwned, setHideNotOwned] = useState<boolean>(false)

  // charge la liste des sets
  useEffect(() => {
    const loadSets = async () => {
      // TODO: Remplacer par une requête Prisma pour récupérer les sets
      setSets([])
    }
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
        // Récupération des cartes depuis la base de données
        const cardIds = collection.map(it => it.externalId)
        const cards = await prisma.card.findMany({
          where: {
            externalId: { in: cardIds },
          },
          select: {
            id: true,
            externalId: true,
            name: true,
            gameType: true,
            gameData: true,
            imageSmall: true,
            imageNormal: true,
            imageLarge: true,
            setCode: true,
            setName: true,
            rarity: true,
            artist: true,
            collectorNumber: true,
          },
        })

        // Association des cartes avec les données de collection
        const enrichedCards = collection
          .map(it => {
            const card = cards.find(c => c.externalId === it.externalId)
            if (!card) return null

            return {
              ...card,
              quantity: it.quantity,
              priceHistory: it.priceHistory || [],
              dbId: it.dbId,
            }
          })
          .filter(Boolean) as GameCard[]

        setEnrichedCollection(enrichedCards)
      } catch (e) {
        console.error('Erreur enrichissement collection:', e)
        setEnrichedCollection([])
      }
    }
    loadEnriched()
  }, [collection])

  // charge les cartes d'un set
  useEffect(() => {
    if (!selectedSet) return
    const loadCards = async () => {
      setLoading(true)
      try {
        // TODO: Remplacer par une requête Prisma pour récupérer les cartes du set
        setSelectedSetCards([])
        setNextPage(undefined)
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
        // TODO: Remplacer par une requête Prisma pour la pagination
        setSelectedSetCards(prev => [...prev])
        setNextPage(undefined)
      } finally {
        setLoading(false)
      }
    }
    loadMoreCards()
  }, [nextPage])

  const getSetName = (code: string): string =>
    sets.find(s => s.code === code)?.name || 'Nom inconnu'
  const getSetIcon = (code: string): string =>
    sets.find(s => s.code === code)?.iconUri || ''
  const getSetTotalCards = (code: string): number | null =>
    sets.find(s => s.code === code)?.cardCount || null

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
            const owned = collection.find(c => c.externalId === card.id)
            return {
              ...card,
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
      ;(uniqueCounts as any)[sc] = (set as Set<string>).size
    })
    return {
      codes: Array.from(setCodes),
      uniqueCounts,
    }
  }, [enrichedCollection])

  // items pour SetBar
  const setBarItems = useMemo(() => {
    return (globalSetStats.codes || []).map((code: any) => ({
      code: code as string,
      name: getSetName(code),
      icon: getSetIcon(code),
      total: getSetTotalCards(code) || 0,
      ownedUnique: (globalSetStats.uniqueCounts as any)[code] || 0,
    }))
  }, [globalSetStats, sets])

  // ---------- Actions côté client (Server Actions derrière) ----------
  const [isPending, startTransition] = useTransition()

  const handleAddToCollection = (card: GameCard): void => {
    const externalId = card.id
    startTransition(async () => {
      try {
        // TODO: Remplacer par une récupération de prix depuis la base de données
        const lastPrice = 0
        const currencyKey = 'usd'
        const newPriceEntry = {
          date: new Date().toISOString().split('T')[0],
          [currencyKey]: lastPrice,
        }

        const result = await actions.addToCollection(externalId, newPriceEntry)
        const { item } = result || {}
        if (!item) return

        setCollection(prev => {
          const idx = prev.findIndex(c => c.externalId === externalId)
          if (idx === -1) {
            return [
              ...prev,
              {
                externalId,
                quantity: item.quantity,
                priceHistory: item.priceHistory || [newPriceEntry],
                dbId: item.id,
              } as AppCollectionItem,
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
          setCollection(prev => prev.filter(c => c.externalId !== cardId))
          return
        }

        if (result.kind === 'updated' && result.item) {
          setCollection(prev => {
            const idx = prev.findIndex(c => c.externalId === cardId)
            if (idx === -1) {
              return [
                ...prev,
                {
                  externalId: cardId,
                  quantity: result.item.quantity,
                  priceHistory: [],
                  dbId: result.item.id,
                } as AppCollectionItem,
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
          setCollection(prev => prev.filter(c => c.externalId !== cardId))
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(e.target.value.toLowerCase())
          }
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
          selectedCode={selectedSet || ''}
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
          toggleSortOrder={() => setSortOrderAsc(!sortOrderAsc)}
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
