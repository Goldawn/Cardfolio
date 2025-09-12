'use client'

import { useState } from 'react'
import Link from 'next/link'
import DeckCase from '../../components/DeckCase'
import styles from './page.module.css'
import type { JSX } from 'react'

interface DecklistClientProps {
  initialDecks: any[]
  actions: {
    createDeck: (name: string) => Promise<any>
  }
}

export default function DecklistsClient({ initialDecks, actions }: DecklistClientProps): JSX.Element {
  const [decklists, setDecklists] = useState<any[]>(initialDecks || [])
  const [newDeckName, setNewDeckName] = useState<string>('')
  const [creating, setCreating] = useState<boolean>(false)

  const handleCreateDeck = async (): Promise<void> => {
    if (!newDeckName.trim() || creating) return
    setCreating(true)
    try {
      const created = await actions.createDeck(newDeckName.trim())
      if (created?.id) {
        setDecklists(prev => [created, ...prev])
        setNewDeckName('')
      }
    } catch (err) {
      console.error('Erreur création deck:', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      {/* Formulaire création si aucun deck */}
      {decklists.length === 0 && (
        <div>
          <input
            type="text"
            placeholder="Nom du deck"
            value={newDeckName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeckName(e.target.value)}
          />
          <button onClick={handleCreateDeck} disabled={creating}>
            {creating ? 'Création...' : '➕ créer le deck'}
          </button>
        </div>
      )}

      {/* Liste des decks */}
      {decklists.length > 0 && (
        <section id={styles.allDecks}>
          <ul className={styles.decklistContainer}>
            {decklists.map((deck: any) => (
              <li key={deck.id}>
                <DeckCase deck={deck} showcasedCard={null} />
                <Link href={`/mtg/decklist/${deck.id}`}>
                  <h3>{deck.name}</h3>
                </Link>
              </li>
            ))}
          </ul>

          {/* Formulaire création supplémentaire en bas si au moins 1 deck existe */}
          <div style={{ marginTop: 16 }}>
            <input
              type="text"
              placeholder="Nom du deck"
              value={newDeckName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDeckName(e.target.value)}
            />
            <button onClick={handleCreateDeck} disabled={creating}>
              {creating ? 'Création...' : '➕ créer un autre deck'}
            </button>
          </div>
        </section>
      )}
    </>
  )
}
