'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import {
  fetchSets,
  fetchSetCards,
  fetchMoreCards,
} from '../services/Scryfall'
import { formatCard } from '../services/FormatCard'
import useCardFilters from '../hooks/useCardFilters'
import { useCurrencyContext } from '@/context/'
import Link from 'next/link'
import Card from '../components/Card'
import CollectionActionBar from '../components/CollectionActionBar'
import { fetchCardPrice } from '../services/pricing'
import styles from './page.module.css'
import type { GameCard, Currency } from '@/types'
import type { ScryfallSet, ScryfallCard } from '../services/Scryfall'
import type { JSX } from 'react'

export default function Collection(): JSX.Element {
  const [collection, setCollection] = useState<GameCard[]>([])
  const [sets, setSets] = useState<ScryfallSet[]>([])
  const [selectedSet, setSelectedSet] = useState<string | undefined>()
  const [selectedSetCards, setSelectedSetCards] = useState<ScryfallCard[]>([])
  const [nextPage, setNextPage] = useState<string | undefined>()
  const [hideNotOwned, setHideNotOwned] = useState<boolean>(false)
  const { currency } = useCurrencyContext()

  const cardsToFilter: GameCard[] =
    selectedSetCards.length === 0
      ? collection
      : selectedSetCards
          .map((card: ScryfallCard): GameCard => {
            const formatted = formatCard(card)
            const owned = collection.find(c => c.id === formatted.id)

            return {
              ...formatted,
              quantity: owned?.quantity || 0,
              priceHistory: owned?.priceHistory || [],
              dbId: (owned as any)?.dbId,
            } as GameCard
          })
          .filter(card => !hideNotOwned || (card.quantity || 0) > 0)

  const { data: session, status } = useSession()
  const userId: string | undefined = session?.user?.id

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

  const collectionStats = useMemo(() => {
    let totalCards = 0
    let totalValue = 0
    const uniqueSets = new Set<string>()
    const cardsPerSet: Record<string, number> = {}
    const uniqueCardsPerSet: Record<string, Set<string>> = {}

    collection.forEach((card: GameCard) => {
      totalCards += card.quantity || 0
      if (card.setCode) {
        uniqueSets.add(card.setCode)

        if (!cardsPerSet[card.setCode]) {
          cardsPerSet[card.setCode] = 0
        }
        cardsPerSet[card.setCode] += card.quantity || 0

        if (!uniqueCardsPerSet[card.setCode]) {
          uniqueCardsPerSet[card.setCode] = new Set<string>()
        }
        uniqueCardsPerSet[card.setCode].add(card.id)
      }

      // console.log(card.priceHistory)
      let lastPrice = 0
      if (card.priceHistory && card.priceHistory.length > 0) {
        const lastPriceEntry = card.priceHistory.at(-1)
        if (lastPriceEntry && (lastPriceEntry as any)[currency]) {
          lastPrice = parseFloat(String((lastPriceEntry as any)[currency]))
        }
      }
      if (isNaN(lastPrice)) {
        console.warn(
          `Prix invalide pour la carte ${card.name} (${card.id}): ${(card.priceHistory?.at(-1) as any)?.[currency]}`
        )
        lastPrice = 0
      }
      totalValue += lastPrice * (card.quantity || 0)
    })

    const uniqueCardsPerSetCounts: Record<string, number> = {}
    for (const [setCode, idSet] of Object.entries(uniqueCardsPerSet)) {
      uniqueCardsPerSetCounts[setCode] = idSet.size
    }

    return {
      totalCards,
      totalSets: uniqueSets.size,
      totalSetsCodes: [...uniqueSets],
      totalValue: totalValue.toFixed(2),
      cardsPerSet,
      uniqueCardsPerSet: uniqueCardsPerSetCounts,
    }
  }, [collection, currency])

  // console.log("Collection stats:", collectionStats);

  useEffect(() => {
    if (!userId) return
    const fetchCollectionFromAPI = async () => {
      console.log('Fetching collection for user:', userId)
      try {
        const res = await fetch(`/api/users/${userId}/collection`)
        if (!res.ok) throw new Error('Erreur de chargement')

        const data = await res.json()
        console.log('Collection DATA :', data)
        const enrichedCards = await Promise.all(
          data.map(async (item: any) => {
            const res = await fetch(
              `https://api.scryfall.com/cards/${item.scryfallId}`
            )
            const rawCard = await res.json()
            const formattedCard = formatCard(rawCard)
            return {
              ...formattedCard,
              quantity: item.quantity,
              priceHistory: Array.isArray(item.priceHistory)
                ? item.priceHistory
                : [],
              dbId: item.id,
            }
          })
        )
        setCollection(enrichedCards)
      } catch (err) {
        console.error('Erreur lors du fetch de la collection enrichie :', err)
      }
    }
    fetchCollectionFromAPI()
  }, [userId])

  useEffect(() => {
    const loadSets = async () => {
      const allSets = await fetchSets()
      setSets(allSets)
    }
    loadSets()
  }, [])

  useEffect(() => {
    if (selectedSet) {
      const loadCards = async () => {
        const cardsData = await fetchSetCards(selectedSet, 'en')
        setSelectedSetCards(cardsData.data)
        if (cardsData.has_more) {
          setNextPage(cardsData.next_page)
        }
      }
      loadCards()
    }
  }, [selectedSet])

  useEffect(() => {
    if (nextPage) {
      const loadMoreCards = async () => {
        const moreCardsData = await fetchMoreCards(nextPage)
        setSelectedSetCards(prev => [...prev, ...moreCardsData.data])
        if (moreCardsData.has_more) {
          setNextPage(moreCardsData.next_page)
        }
      }
      loadMoreCards()
    }
  }, [nextPage])

  const toggleHideCards = (): void => {
    setHideNotOwned(!hideNotOwned)
  }

  useEffect(() => {
    console.log(hideNotOwned)
  }, [hideNotOwned])

  const updateQuantity = async (cardId: string, delta: number): Promise<void> => {
    const card = collection.find(c => c.id === cardId)
    if (!card || !(card as any).dbId) return

    try {
      const res = await fetch(`/api/users/${userId}/collection`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scryfallId: card.id,
          quantityDelta: delta,
        }),
      })

      if (res.status === 204) {
        setCollection(prev => prev.filter(c => c.id !== cardId))
      } else if (res.ok) {
        const updated = await res.json()
        setCollection(prev =>
          prev.map(c =>
            c.id === cardId ? { ...c, quantity: updated.quantity } : c
          )
        )
      } else {
        throw new Error('Erreur lors de la mise à jour')
      }
    } catch (err) {
      console.error('Erreur updateQuantity :', err)
    }
  }

  const removeCard = async (cardId: string): Promise<void> => {
    const card = collection.find(c => c.id === cardId)
    if (!card || !(card as any).dbId) return

    try {
      const res = await fetch(`/api/users/${userId}/collection`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scryfallId: card.id }),
      })

      if (!res.ok) throw new Error('Erreur lors de la suppression')

      setCollection(prev => prev.filter(c => c.id !== cardId))
    } catch (err) {
      console.error('Erreur removeCard :', err)
    }
  }

  const getSetName = (setCode: string): string =>
    sets.find(set => set.code === setCode)?.name || 'Nom inconnu'
  const getSetIcon = (setCode: string): string =>
    sets.find(set => set.code === setCode)?.icon_svg_uri || ''
  const getSetTotalCards = (setCode: string): number | null =>
    sets.find(set => set.code === setCode)?.card_count || null

  const handleSelectedSet = (setCode: string): void => {
    if (selectedSet === setCode) {
      setSelectedSet(undefined)
      setSelectedSetCards([])
    } else {
      setSelectedSet(setCode)
    }
  }

  const handleAddToCollection = async (card: GameCard): Promise<void> => {
    const scryfallId = card.id
    const { usd, eur } = await fetchCardPrice(card.name)
    const lastPrice = eur || usd || 0
    const priceCurrency: Currency = eur ? 'eur' : 'usd'
    const newPriceEntry = {
      date: new Date().toISOString().split('T')[0],
      [priceCurrency]: lastPrice,
    }

    try {
      const res = await fetch(`/api/users/${userId}/collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scryfallId,
          quantity: 1,
          priceHistory: [newPriceEntry],
        }),
      })

      if (res.ok) {
        const createdItem = await res.json()

        // On va chercher les données scryfall complètes
        const scryfallRes = await fetch(
          `https://api.scryfall.com/cards/${createdItem.scryfallId}`
        )
        const rawCard = await scryfallRes.json()
        const formattedCard = formatCard(rawCard)

        // On construit la carte enrichie avec dbId, quantité et historique des prix
        const enrichedCard = {
          ...formattedCard,
          quantity: createdItem.quantity,
          priceHistory: createdItem.priceHistory || [],
          dbId: createdItem.id,
        }

        setCollection(prev => [...prev, enrichedCard])
      }
    } catch (err) {
      console.error('Erreur handleAddToCollection :', err)
    }
  }

  if (status === 'loading') return <p>Chargement de la session...</p>
  if (status === 'unauthenticated')
    return <p>Veuillez vous connecter pour accéder à cette page.</p>

  return (
    <div id={styles.collectionPage}>
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
          {/* <div> */}
          <label htmlFor="hideNotOwned">
            Hide not owned
            <input
              type="checkbox"
              onChange={toggleHideCards}
              name="hideNotOwned"
              id="hideNotOwned"
              checked={hideNotOwned}
            ></input>
          </label>
          {/* </div> */}
        </p>

        {collection && (
          <div className={styles.setsContainer}>
            {collectionStats.totalSetsCodes.map((setCode: string, index: number) => (
              <div
                className={`${styles.setNames} ${selectedSet === setCode ? styles.active : ''}`}
                key={index}
                onClick={() => handleSelectedSet(setCode)}
              >
                {getSetIcon(setCode) && (
                  <img src={getSetIcon(setCode)} alt={getSetName(setCode)} />
                )}
                <p>{getSetName(setCode)}</p>
                <p>
                  {collectionStats.uniqueCardsPerSet[setCode]}/
                  {getSetTotalCards(setCode)}
                </p>
              </div>
            ))}
          </div>
        )}

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
              onAddToCollection={() => handleAddToCollection(card)}
              showDeleteButton
              updateQuantity={updateQuantity}
              onRemove={removeCard}
              currency={currency as Currency}
              compareWithCollection={Boolean(selectedSet)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
