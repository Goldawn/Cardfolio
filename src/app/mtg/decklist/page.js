"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DeckCase from "../../components/DeckCase";
import CardMenu from "../../components/CardMenu";
import Card from "../../components/Card";
import { formatCard } from "../../services/FormatCard";
import Link from "next/link";
import styles from "./page.module.css";
import CardModal from "../../components/CardModal";

export default function DecklistPage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [decklists, setDecklists] = useState([]);
      const [newDeckName, setNewDeckName] = useState("");
    
    const userId = session?.user?.id;

    useEffect(() => {console.log(decklists)}, [decklists]);

    useEffect(() => {
        if (status === "authenticated") {
        fetchDecklists();
        }
    }, [userId, status]);

    const fetchDecklists = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/users/${userId}/decklist`);
            const data = await res.json();
            setDecklists(data);
        } catch (error) {
            console.error("Erreur lors du chargement des decks :", error);
        } finally {
            setLoading(false);
        }
    }

    const handleCreateDeck = async () => {
        if (!newDeckName.trim()) return;

        try {
            const res = await fetch(`/api/users/${userId}/decklist`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newDeckName }),
            });

            if (!res.ok) throw new Error("Erreur lors de la création du deck");

            const newDeck = await res.json();
            setDecklists([...decklists, newDeck]);
            setNewDeckName("");
        } catch (error) {
            console.error("Erreur création deck:", error);
        }
    }
    
    if (status === "loading") return <p>Chargement de la session...</p>;
    if (status === "unauthenticated") return <p>Veuillez vous connecter.</p>;

    return (
        <>
            <h1>DeckList</h1>

            {/* <CardMenu /> */}

            {loading && <p>Chargement des listes...</p>}
            {!loading && decklists.length === 0 && 
                <div>
                    <input
                        type="text"
                        placeholder="Nom du deck"
                        value={newDeckName}
                        onChange={(e) => setNewDeckName(e.target.value)}
                    />
                    <button onClick={handleCreateDeck}>➕ créer le deck</button>
                </div>
            }

            {!loading && decklists.length > 0 && (
                <section id={styles.allDecks}>
                    <ul className={styles.decklistContainer}>
                        {decklists.map((deck, id) => (
                            <li key={id}>
                                <DeckCase 
                                    userId={userId}
                                    deck={deck}
                                />
                                <Link href={`/mtg/decklist/${deck.id}`}><h3>{deck.name}</h3></Link>
                            </li>
                        ))
                        }
                    </ul>
                </section>
            )}
        </>
    )
}