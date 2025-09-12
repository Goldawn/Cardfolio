'use client'

import { cardApiManager } from '@/app/services/CardApiManager'
import type { GameCard } from '@/types'
import { useSession } from 'next-auth/react'
import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'

// Hook useCardFilters simplifié
function useCardFilters(cards: GameCard[]) {
  const [sortOption, setSortOption] = useState('name')
  const [sortOrderAsc, setSortOrderAsc] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedRarities, setSelectedRarities] = useState<string[]>([])

  const sortedAndFilteredCards = useMemo(() => {
    let filtered = cards.filter(card => {
      if (
        searchQuery &&
        !card.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      // Ajouter d'autres filtres si nécessaire
      return true
    })

    // Tri
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortOption) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'set':
          aValue = a.setCode || ''
          bValue = b.setCode || ''
          break
        case 'rarity':
          aValue = a.rarity || ''
          bValue = b.rarity || ''
          break
        case 'price':
          aValue = a.priceHistory?.[0]?.usd || 0
          bValue = b.priceHistory?.[0]?.usd || 0
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (aValue < bValue) return sortOrderAsc ? -1 : 1
      if (aValue > bValue) return sortOrderAsc ? 1 : -1
      return 0
    })

    return filtered
  }, [
    cards,
    searchQuery,
    sortOption,
    sortOrderAsc,
    selectedColors,
    selectedTypes,
    selectedRarities,
  ])

  return {
    sortOption,
    setSortOption,
    sortOrderAsc,
    setSortOrderAsc,
    searchQuery,
    setSearchQuery,
    selectedColors,
    toggleColorFilter: (color: string) => {
      setSelectedColors(prev =>
        prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
      )
    },
    selectedTypes,
    toggleTypeFilter: (type: string) => {
      setSelectedTypes(prev =>
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
      )
    },
    selectedRarities,
    toggleRarityFilter: (rarity: string) => {
      setSelectedRarities(prev =>
        prev.includes(rarity)
          ? prev.filter(r => r !== rarity)
          : [...prev, rarity]
      )
    },
    sortedAndFilteredCards,
  }
}

export default function Collection(): JSX.Element {
  const [collection, setCollection] = useState<GameCard[]>([])
  const [sets, setSets] = useState<any[]>([])
  const [selectedSet, setSelectedSet] = useState<string>('')
  const [selectedSetCards, setSelectedSetCards] = useState<GameCard[]>([])
  const [nextPage, setNextPage] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState<'eur' | 'usd'>('eur')

  const { data: session } = useSession()
  const userId = session?.user?.id

  // Instance du service Card API
  const cardService = cardApiManager.getCardService()

  // Filtres et tri des cartes
  const cardsToFilter = useMemo(() => collection, [collection])
  const {
    sortOption,
    setSortOption,
    sortOrderAsc,
    setSortOrderAsc,
    searchQuery,
    setSearchQuery,
    sortedAndFilteredCards,
  } = useCardFilters(cardsToFilter)

  // Statistiques de la collection
  const collectionStats = useMemo(() => {
    let totalCards = 0
    let totalValue = 0
    const uniqueSets = new Set<string>()
    const cardsPerSet: Record<string, number> = {}
    const uniqueCardsPerSetCounts: Record<string, number> = {}

    collection.forEach(card => {
      totalCards += card.quantity || 1

      // Calcul de la valeur
      const latestPrice = card.priceHistory?.[0]
      if (latestPrice) {
        const price = currency === 'eur' ? latestPrice.eur : latestPrice.usd
        totalValue += price * (card.quantity || 1)
      }

      // Statistiques par set
      if (card.setCode) {
        uniqueSets.add(card.setCode)
        cardsPerSet[card.setCode] =
          (cardsPerSet[card.setCode] || 0) + (card.quantity || 1)

        // Comptage des cartes uniques par set
        if (!uniqueCardsPerSetCounts[card.setCode]) {
          uniqueCardsPerSetCounts[card.setCode] = 0
        }
        uniqueCardsPerSetCounts[card.setCode]++
      }
    })

    return {
      totalCards,
      totalSets: uniqueSets.size,
      totalSetsCodes: [...uniqueSets],
      totalValue: totalValue.toFixed(2),
      cardsPerSet,
      uniqueCardsPerSet: uniqueCardsPerSetCounts,
    }
  }, [collection, currency])

  // Chargement de la collection enrichie - NOUVEAU
  useEffect(() => {
    if (!userId) return
    const fetchCollectionFromAPI = async () => {
      console.log('Fetching collection for user:', userId)
      try {
        const res = await fetch(`/api/users/${userId}/collection`)
        if (!res.ok) throw new Error('Erreur de chargement')

        const data = await res.json()
        console.log('Collection DATA :', data)

        // Utilisation du nouveau service pour enrichir les cartes
        const enrichedCards = await Promise.all(
          data.map(async (item: any) => {
            try {
              const card = await cardService.fetchCard({
                cardId: item.externalId,
              })
              return {
                ...card,
                quantity: item.quantity,
                priceHistory: Array.isArray(item.priceHistory)
                  ? item.priceHistory
                  : [],
                dbId: item.id,
              }
            } catch (error) {
              console.error(
                `Erreur enrichissement carte ${item.externalId}:`,
                error
              )
              // Retourner une carte basique en cas d'erreur
              return {
                id: item.externalId,
                name: 'Carte non trouvée',
                gameType: 'magic' as const,
                quantity: item.quantity,
                priceHistory: [],
                dbId: item.id,
                gameData: {},
              }
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

  // Chargement des sets - NOUVEAU
  useEffect(() => {
    const loadSets = async () => {
      try {
        const allSets = await cardService.fetchSets()
        setSets(allSets)
      } catch (error) {
        console.error('Erreur chargement sets:', error)
      }
    }
    loadSets()
  }, [])

  // Chargement des cartes d'un set - NOUVEAU
  useEffect(() => {
    if (!selectedSet) return
    const loadCards = async () => {
      setLoading(true)
      try {
        const cards = await cardService.fetchSetCards({
          setCode: selectedSet,
          language: 'en',
          options: {
            fetchAllPages: false, // Récupère seulement la première page
          },
        })
        setSelectedSetCards(cards)

        // TODO: Implémenter la pagination si nécessaire
        setNextPage(undefined)
      } catch (error) {
        console.error('Erreur chargement cartes set:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCards()
  }, [selectedSet])

  // Pagination - NOUVEAU
  useEffect(() => {
    if (!nextPage) return
    const loadMoreCards = async () => {
      setLoading(true)
      try {
        const moreCards = await cardService.fetchMoreCards(nextPage)
        setSelectedSetCards(prev => [...prev, ...moreCards])
        setNextPage(undefined) // TODO: Implémenter la pagination complète
      } catch (error) {
        console.error('Erreur chargement plus de cartes:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMoreCards()
  }, [nextPage])

  // Fonctions utilitaires
  const getSetName = (code: string): string =>
    sets.find(s => s.code === code)?.name || 'Nom inconnu'

  const _getSetIcon = (code: string): string =>
    sets.find(s => s.code === code)?.iconUri || ''

  const _getSetTotalCards = (code: string): number | null =>
    sets.find(s => s.code === code)?.cardCount || null

  return (
    <div className="collection-page">
      <h1>Ma Collection</h1>

      {/* Statistiques */}
      <div className="collection-stats">
        <div className="stat-item">
          <h3>Total Cartes</h3>
          <p>{collectionStats.totalCards}</p>
        </div>
        <div className="stat-item">
          <h3>Sets Uniques</h3>
          <p>{collectionStats.totalSets}</p>
        </div>
        <div className="stat-item">
          <h3>Valeur Totale</h3>
          <p>
            {collectionStats.totalValue} {currency.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters-section">
        <div className="search-container">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher une carte..."
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            className="sort-select"
          >
            <option value="name">Nom</option>
            <option value="set">Set</option>
            <option value="rarity">Rareté</option>
            <option value="price">Prix</option>
          </select>

          <button
            onClick={() => setSortOrderAsc(!sortOrderAsc)}
            className="sort-order-button"
          >
            {sortOrderAsc ? '↑' : '↓'}
          </button>

          <select
            value={currency}
            onChange={e => setCurrency(e.target.value as 'eur' | 'usd')}
            className="currency-select"
          >
            <option value="eur">EUR</option>
            <option value="usd">USD</option>
          </select>
        </div>
      </div>

      {/* Sélection de set */}
      <div className="set-selection">
        <h3>Voir les cartes d'un set</h3>
        <select
          value={selectedSet}
          onChange={e => setSelectedSet(e.target.value)}
          className="set-select"
        >
          <option value="">Sélectionner un set</option>
          {sets.map(set => (
            <option key={set.id} value={set.code}>
              {set.name} ({set.cardCount} cartes)
            </option>
          ))}
        </select>
      </div>

      {/* Cartes du set sélectionné */}
      {selectedSet && (
        <div className="set-cards-section">
          <h3>Cartes du set {getSetName(selectedSet)}</h3>
          {loading && <p>Chargement...</p>}
          <div className="set-cards-grid">
            {selectedSetCards.map(card => (
              <div key={card.id} className="set-card-item">
                <img
                  src={card.image || '/placeholder.png'}
                  alt={card.name}
                  className="set-card-image"
                />
                <div className="set-card-info">
                  <h4>{card.name}</h4>
                  <p>
                    {card.collectorNumber} - {card.rarity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collection filtrée */}
      <div className="collection-grid">
        <h3>Ma Collection ({sortedAndFilteredCards.length} cartes)</h3>
        <div className="cards-grid">
          {sortedAndFilteredCards.map((card: GameCard) => (
            <div key={card.id} className="collection-card-item">
              <img
                src={card.image || '/placeholder.png'}
                alt={card.name}
                className="card-image"
              />
              <div className="card-info">
                <h4>{card.name}</h4>
                <p>
                  {card.setCode} - {card.rarity}
                </p>
                <p>Quantité: {card.quantity}</p>
                <p>
                  Prix: {card.priceHistory?.[0]?.[currency] || 'N/A'}{' '}
                  {currency.toUpperCase()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
