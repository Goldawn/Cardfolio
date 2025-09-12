'use client'

import type { GameSet } from '@/card-api-service/dto'
import type { CollectionActions, GameCard } from '@/types'
import type { JSX } from 'react'
import { Fragment, useEffect, useState } from 'react'
import Card from '../../components/Card'
import CollectionActionBar from '../../components/CollectionActionBar'
import Loader from '../../components/Loader'
import useCardFilters from '../../hooks/useCardFilters'
import { useCards } from './hooks/useCards'
import { useCollection } from './hooks/useCollection'
import { useSets } from './hooks/useSets'
import type { WishlistActions } from './hooks/useWishlists'
import { useWishlists } from './hooks/useWishlists'
import styles from './page.module.css'

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
  userId: _userId,
}: ImportClientProps): JSX.Element {
  // Hooks personnalisés
  const { sets: _sets, loading: setsLoading, filterSetsByName } = useSets()
  const { cards, loading: cardsLoading, loadSetCards } = useCards()
  const {
    collection,
    recentlyAdded,
    isPending: collectionPending,
    addToCollection,
    updateQuantity,
    removeFromCollection,
    handleRecentCardClick,
  } = useCollection(initialCollection, actions as CollectionActions)
  const {
    wishlistLists,
    wishlistTotals,
    isPending: wishlistPending,
    createWishlist,
    addToWishlist,
  } = useWishlists(initialWishlistLists, actions as WishlistActions)

  // États locaux
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
  const [displaySetList, setDisplaySetList] = useState<boolean>(false)
  const [isReduced, setIsReduced] = useState<boolean>(false)

  const isPending = collectionPending || wishlistPending

  // Les cartes sont déjà formatées par le service
  const formattedCards = cards
  const enrichedCards = formattedCards.map((card: GameCard) => {
    const owned = collection.find(c => c.externalId === card.id)
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

  // Gestion de la recherche de sets
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const query = e.target.value
    const filtered = filterSetsByName(query)
    setFilteredSets(filtered)
    setDisplaySetList(false)
  }

  useEffect(() => {
    setDisplaySetList(filteredSets.length > 0)
  }, [filteredSets])

  const handleSetSelect = (set: GameSet): void => {
    setSelectedSet({ ...set })
    setDisplaySetList(false)
  }

  // Charger les cartes quand un set est sélectionné
  useEffect(() => {
    if (selectedSet.code) {
      loadSetCards(selectedSet)
    }
  }, [selectedSet, loadSetCards])

  // Fonction pour gérer le clic sur une carte récemment ajoutée
  const onRecentCardClick = (cardId: string) => {
    handleRecentCardClick(cardId, formattedCards)
  }

  const toggleSortOrder = () => setSortOrderAsc(!sortOrderAsc)

  return (
    <div
      id={styles.importPage}
      aria-busy={isPending || setsLoading || cardsLoading}
    >
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
                <strong className={!set.parentSetCode ? styles.expansion : ''}>
                  {set.name}
                </strong>{' '}
                ({set.code}) ({set.cardCount} cartes) <i>{set.releaseDate}</i>
              </li>
            ))}
          </ul>
        )}
      </div>

      {(setsLoading || cardsLoading) && <Loader />}

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
                  updateQuantity={updateQuantity}
                  wishlistLists={wishlistLists}
                  onAddToCollection={() => addToCollection(card)}
                  onCreateWishlist={createWishlist}
                  onAddToWishlist={async (listId: string, card: GameCard) =>
                    addToWishlist(listId, card)
                  }
                  onRemove={removeFromCollection}
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
            {recentlyAdded.map(
              (
                { id, card, count }: { id: string; card: any; count: number },
                index: number
              ) => (
                <div
                  key={`${id}-${index}`}
                  onClick={() => onRecentCardClick(id)} // 👈 clique = -1
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
              )
            )}
          </div>
        </aside>
      )}
    </div>
  )
}
