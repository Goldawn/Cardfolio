'use client'

import { prisma } from '@/lib/prisma'
import type { MTGCard } from '@/types'
import type { JSX } from 'react'
import { useEffect, useMemo, useState, useTransition } from 'react'
import Card from '../../../components/Card'
import AddFromCollection from '../../../components/deck/AddFromCollection'
import DeckCardsTabs from '../../../components/deck/DeckCardsTabs'
import DeckHeader from '../../../components/deck/DeckHeader'
import DeckSettingsPanel from '../../../components/deck/DeckSettingsPanel'
import ManualAdd from '../../../components/deck/ManualAdd'
import { evaluateDeckLegality } from '../../../services/Legalities'
import styles from './page.module.css'

interface DeckClientProps {
  deck: any
  initialDeckCards: any[]
  initialUserCollectionItems: any[]
  wishlistLists: any[]
  actions: any
}

export default function DeckClient({
  deck,
  initialDeckCards,
  initialUserCollectionItems,
  wishlistLists,
  actions,
}: DeckClientProps): JSX.Element {
  // console.log(deck)
  const [deckState, setDeckState] = useState(deck) // { id, name, format, showcasedCard }
  const [deckCards, setDeckCards] = useState(initialDeckCards || [])
  const [enriched, setEnriched] = useState<MTGCard[]>([]) // cartes formatées  { deckCardId, decklistQuantity }
  const [tab, setTab] = useState<string>('fromCollection') // "fromCollection" | "manual" | "import"
  const [isPending, startTransition] = useTransition()
  const [deckColors, setDeckColors] = useState<string[]>([]) // ["W","U","B","R","G","C"]

  // -------- Enrichissement des cartes du deck avec Prisma --------
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!deckCards || deckCards.length === 0) {
        setEnriched([])
        return
      }
      try {
        // Récupération des cartes depuis la base de données
        const cardIds = deckCards.map(dc => dc.externalId)
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

        // Association des cartes avec les données du deck
        const out = deckCards
          .map(dc => {
            const card = cards.find(c => c.externalId === dc.externalId)
            if (!card) return null

            return {
              id: card.externalId,
              externalId: card.externalId,
              name: card.name,
              gameType: card.gameType,
              setCode: card.setCode,
              setName: card.setName,
              rarity: card.rarity,
              artist: card.artist,
              collectorNumber: card.collectorNumber,
              gameData: card.gameData as any,
              image:
                card.imageLarge || card.imageNormal || card.imageSmall || '',
              imageSmall: card.imageSmall,
              imageNormal: card.imageNormal,
              imageLarge: card.imageLarge,
              decklistQuantity: dc.quantity,
              deckCardId: dc.id,
            } as unknown as MTGCard
          })
          .filter(Boolean) as MTGCard[]

        if (!cancelled) setEnriched(out)
      } catch (e) {
        console.error('Erreur enrichissement deck:', e)
        if (!cancelled) setEnriched([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [deckCards])

  // Recalcule les couleurs du deck à partir des cartes présentes
  useEffect(() => {
    const set = new Set<string>()
    // on s’appuie sur "enriched" + "deckCards" pour ne compter que les cartes présentes
    const qtyById = new Map(
      deckCards.map(dc => [dc.externalId, dc.quantity || 0])
    )
    enriched.forEach((c: MTGCard) => {
      const qty = qtyById.get(c.id) || 0
      if (qty <= 0) return
      if ((c as any).type?.includes('Basic Land')) return // ignore lands de base
      if (Array.isArray(c.colors)) {
        c.colors.forEach((clr: any) => set.add(clr || 'C'))
      }
      // fallback "incolore" si pas de colors mais cout de mana présent
      if (
        (!c.colors || c.colors.length === 0) &&
        ((c as any).manaCost || '').length > 0
      ) {
        set.add('C')
      }
    })
    setDeckColors(Array.from(set))
  }, [enriched, deckCards])

  // -------- LÉGALITÉ (résumé  marquage cartes) --------
  const legality = useMemo(() => {
    return evaluateDeckLegality(
      { format: deckState.format },
      deckCards,
      enriched as any,
      {
        // Optionnel : si un jour tu as l’ID scryfall du commandant pour Pauper Commander
        // commanderScryfallId: deckState.commanderScryfallId ?? null
      }
    )
  }, [deckState.format, deckCards, enriched])

  const isCardProblematic = (card: any): boolean => {
    return legality.issues.some(i => i.externalId === card.id)
  }

  // -------- Handlers deck (server actions) --------
  const addCardToDeck = (externalId: string, qty: number = 1): void => {
    startTransition(async () => {
      try {
        const res = await actions.addCardToDeck(deck.id, externalId, qty)
        if (!res?.item) return
        const item = res.item // { id, externalId, quantity }
        setDeckCards(prev => {
          const idx = prev.findIndex(d => d.externalId === item.externalId)
          if (idx === -1)
            return [
              {
                id: item.id,
                externalId: item.externalId,
                quantity: item.quantity,
              },
              ...prev,
            ]
          const copy = [...prev]
          copy[idx] = { ...copy[idx], id: item.id, quantity: item.quantity }
          return copy
        })
      } catch (e) {
        console.error('addCardToDeck error:', e)
      }
    })
  }

  const updateDeckCardQty = (deckCardId: string, nextQty: number): void => {
    startTransition(async () => {
      try {
        const res = await actions.updateDeckCardQty(deckCardId, nextQty)
        if (!res) return

        if (res.kind === 'deleted') {
          setDeckCards(prev => prev.filter(dc => dc.id !== deckCardId))
        } else if (res.kind === 'updated' && res.item) {
          setDeckCards(prev =>
            prev.map(dc =>
              dc.id === deckCardId ? { ...dc, quantity: res.item.quantity } : dc
            )
          )
        }
      } catch (e) {
        console.error('updateDeckCardQty error:', e)
      }
    })
  }

  const removeCardFromDeck = (deckCardId: string): void => {
    startTransition(async () => {
      try {
        const res = await actions.removeCardFromDeck(deckCardId)
        if (res?.kind === 'deleted') {
          setDeckCards(prev => prev.filter(dc => dc.id !== deckCardId))
        }
      } catch (e) {
        console.error('removeCardFromDeck error:', e)
      }
    })
  }

  const setShowcased = (deckCardId: string, artUrl: string): void => {
    startTransition(async () => {
      try {
        const updated = await actions.setShowcasedCard(deckState.id, {
          deckCardId,
          artUrl,
        })
        setDeckState((prev: any) => ({
          ...prev,
          showcasedCardId: updated.showcasedCardId ?? null,
          showcasedArt: updated.showcasedArt ?? null,
        }))
      } catch (e) {
        console.error('setShowcased error:', e)
      }
    })
  }

  // Mise à jour locale depuis le panneau paramètres
  const applyDeckLocalUpdate = (partial: any): void => {
    setDeckState((prev: any) => ({ ...prev, ...partial }))
  }

  return (
    <div id={styles.deckPage}>
      <div id={styles.deckManager} aria-busy={isPending}>
        <section
          id={styles.decklistOverview}
          style={{ display: 'grid', gap: 16 }}
        >
          <DeckHeader deck={deckState} colors={deckColors} cards={enriched} />

          <DeckCardsTabs
            cards={enriched as any}
            deckState={deckState}
            isPending={isPending}
            legality={legality}
            updateDeckCardQty={updateDeckCardQty}
            removeCardFromDeck={removeCardFromDeck}
            setShowcased={setShowcased}
            isCardProblematic={isCardProblematic}
            CardComponent={Card}
          />
        </section>

        {/* Onglets d’ajout */}
        <nav style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
          <button
            onClick={() => setTab('fromCollection')}
            disabled={tab === 'fromCollection'}
          >
            Depuis la collection
          </button>
          <button onClick={() => setTab('manual')} disabled={tab === 'manual'}>
            Ajout manuel
          </button>
          <button onClick={() => setTab('import')} disabled={tab === 'import'}>
            Importer une liste
          </button>
        </nav>

        {tab === 'fromCollection' && (
          <AddFromCollection
            deckId={deckState.id}
            collectionItems={initialUserCollectionItems}
            currentDeckCards={deckCards}
            onAdd={async (externalId: string, qty: number) => {
              await addCardToDeck(externalId, qty)
            }}
          />
        )}

        {tab === 'manual' && (
          <ManualAdd
            deckId={deckState.id}
            onAdd={async (externalId: string, qty: number) => {
              await addCardToDeck(externalId, qty)
            }}
          />
        )}

        {tab === 'import' && (
          <div
            style={{
              opacity: 0.6,
              padding: 12,
              border: '1px dashed #ccc',
              borderRadius: 8,
            }}
          >
            (À venir) Coller texte / Import CSV-JSON → preview → import
          </div>
        )}
      </div>

      <aside>
        <DeckSettingsPanel
          deck={deckState}
          deckCards={deckCards}
          collectionItems={initialUserCollectionItems}
          wishlistLists={wishlistLists}
          actions={{
            renameDeck: actions.renameDeck,
            setDeckFormat: actions.setDeckFormat,
            setShowcasedCard: actions.setShowcasedCard,
            deleteDeck: actions.deleteDeck,
            toggleDeckLock: actions.toggleDeckLock,
            updateDeckNotes: actions.updateDeckNotes,
            duplicateDeck: actions.duplicateDeck,
            createWishlist: actions.createWishlist,
            addManyToWishlist: actions.addManyToWishlist,
          }}
          onLocalUpdate={applyDeckLocalUpdate}
        />
      </aside>
    </div>
  )
}
