'use client'

import { useState, useTransition, useMemo } from 'react'
import AddMissingToWishlistModal from './AddMissingToWishlistModal'
import ExportFlow from '../ExportFlow'
import styles from './DeckSettingsPanel.module.css'

const FORMAT_OPTIONS = [
  'standard',
  'future',
  'historic',
  'timeless',
  'gladiator',
  'pioneer',
  'modern',
  'legacy',
  'pauper',
  'vintage',
  'penny',
  'commander',
  'oathbreaker',
  'standardbrawl',
  'brawl',
  'alchemy',
  'paupercommander',
]

export default function DeckSettingsPanel({
  deck, // { id, name, format, showcasedCard }
  deckCards,
  actions, // { renameDeck, setDeckFormat, setShowcasedCard, deleteDeck }
  onLocalUpdate, // (partial) => void (pour rafraîchir le state local du deck)
  collectionItems,
  wishlistLists,
}) {

  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(deck.name || '')
  const [format, setFormat] = useState(deck.format || 'commander')
  const [missingOpen, setMissingOpen] = useState(false)

  const submitName = () => {
    if (!name.trim() || name === deck.name) return
    startTransition(async () => {
      const updated = await actions.renameDeck(deck.id, name.trim())
      onLocalUpdate?.({ name: updated.name })
    })
  }

  const submitFormat = () => {
    if (!format || format === deck.format) return
    startTransition(async () => {
      const updated = await actions.setDeckFormat(deck.id, format)
      onLocalUpdate?.({ format: updated.format })
    })
  }

  const confirmDelete = () => {
    if (!confirm('Supprimer définitivement ce deck ?')) return
    startTransition(async () => {
      const res = await actions.deleteDeck(deck.id)
      if (res?.ok) {
        // Redirection simple côté client
        window.location.href = '/mtg/decklist'
      }
    })
  }

 // ---- Shape pour l'export Arena ----
 const deckShape = useMemo(() => {
  console.log("deckCards", deckCards)
   const norm = (c) => {
     const name = c.name ?? c.card?.name ?? c.print?.name ?? ''
     const set =
       (c.set ?? c.setCode ?? c.card?.set ?? c.print?.set)?.toString().toUpperCase()
     const collectorNumber =
       c.collectorNumber ?? c.number ?? c.print?.collectorNumber ?? c.print?.number
     const quantity = Number(c.quantity ?? c.count ?? 1)
     const zone =
       (c.zone?.toLowerCase?.() ??
        (c.isSideboard ? 'sideboard' : 'main') ??
        'main')
     return { quantity, name, set, collectorNumber, zone }
   }
   const all = Array.isArray(deckCards) ? deckCards.map(norm) : []
   const byZone = (z) => all.filter((e) => (e.zone ?? 'main') === z).map(({zone, ...rest}) => rest)
   const shape = {
     main: byZone('main'),
     sideboard: byZone('sideboard'),
     companion: byZone('companion'),
   }
   // Nettoyage: retire les zones vides
   if (!shape.sideboard.length) delete shape.sideboard
   if (!shape.companion?.length) delete shape.companion
   return shape
 }, [deckCards])

  return (
    <div className={styles.settingsPanel}>
      <h3>Paramètres du deck</h3>

      <button
        onClick={async () => {
          const res = await actions.toggleDeckLock(deck.id)
          onLocalUpdate({ isLocked: res.isLocked })
        }}
        title={deck.isLocked ? 'Déverrouiller' : 'Verrouiller'}
      >
        {/* {deck.isLocked ? "🔒 Verrouillé" : "🔓 Déverrouillé"} */}
        {deck.isLocked ? '🔒' : '🔓'}
      </button>

      <button
        onClick={async () => {
          const copy = await actions.duplicateDeck(deck.id)
          // à toi de router vers le nouveau deck si tu veux
          alert(`Deck dupliqué: ${copy.name}`)
        }}
      >
        Dupliquer le deck
      </button>

      {/* 📝 Notes */}
      <label style={{ display: 'grid', gap: 6 }}>
        <span>Notes</span>
        <textarea
          rows={4}
          defaultValue={deck.notes ?? ''}
          onBlur={async e => {
            const val = e.currentTarget.value
            const res = await actions.updateDeckNotes(deck.id, val || null)
            onLocalUpdate({ notes: res.notes ?? null })
          }}
          placeholder="Notes personnelles (matchups, sideboard, idées...)"
        />
        <small>La note est enregistrée quand tu quittes le champ.</small>
      </label>

      <ExportFlow
        kind="deck"
        data={deckShape}
        label="Exporter le deck"
        filenameBase={deck?.name || "deck"}
        defaultFormat="arena"
        includeSet
      />

      <button onClick={() => setMissingOpen(true)}>
        Ajouter les cartes manquantes à une wishlist
      </button>

      <AddMissingToWishlistModal
        open={missingOpen}
        onClose={() => setMissingOpen(false)}
        deck={deck}
        deckCards={deckCards}
        collectionItems={collectionItems}
        wishlistLists={wishlistLists}
        actions={{
          createWishlist: actions.createWishlist,
          addManyToWishlist: actions.addManyToWishlist,
        }}
      />

      <label>
        <span>Nom</span>
        <div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isPending}
          />
          <button
            onClick={submitName}
            disabled={isPending || !name.trim() || name === deck.name}
          >
            Renommer
          </button>
        </div>
      </label>

      <label>
        <span>Format</span>
        <div>
          <select
            value={format}
            onChange={e => setFormat(e.target.value)}
            disabled={isPending}
          >
            {FORMAT_OPTIONS.map(f => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button
            onClick={submitFormat}
            disabled={isPending || format === deck.format}
          >
            Appliquer
          </button>
        </div>
      </label>
      <hr />

      <button
        className={styles.deleteButton}
        onClick={confirmDelete}
        disabled={isPending}
      >
        Supprimer le deck
      </button>
    </div>
  )
}
