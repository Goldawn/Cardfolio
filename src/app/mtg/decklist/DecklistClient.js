"use client";

import { useState } from "react";
import Link from "next/link";
import DeckCase from "../../components/DeckCase";
import styles from "./page.module.css";

export default function DecklistsClient({ initialDecks, actions }) {

  const [decklists, setDecklists] = useState(initialDecks || []);
  const [newDeckName, setNewDeckName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreateDeck = async () => {
    if (!newDeckName.trim() || creating) return;
    setCreating(true);
    try {
      const created = await actions.createDeck(newDeckName.trim());
      if (created?.id) {
        setDecklists((prev) => [created, ...prev]);
        setNewDeckName("");
      }
    } catch (err) {
      console.error("Erreur création deck:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <h1>DeckList</h1>

      {/* Formulaire création si aucun deck */}
      {decklists.length === 0 && (
        <div>
          <input
            type="text"
            placeholder="Nom du deck"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
          />
          <button onClick={handleCreateDeck} disabled={creating}>
            {creating ? "Création..." : "➕ créer le deck"}
          </button>
        </div>
      )}

      {/* Liste des decks */}
      {decklists.length > 0 && (
        <section id={styles.allDecks}>
          <ul className={styles.decklistContainer}>
            {decklists.map((deck) => (
              <li key={deck.id}>
                <DeckCase deck={deck} />
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
              onChange={(e) => setNewDeckName(e.target.value)}
            />
            <button onClick={handleCreateDeck} disabled={creating}>
              {creating ? "Création..." : "➕ créer un autre deck"}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
