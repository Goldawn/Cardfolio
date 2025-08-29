"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { formatCard } from "../../../services/FormatCard";
import DeckSettingsPanel from "../../../components/deck/DeckSettingsPanel";
import AddFromCollection from "../../../components/deck/AddFromCollection";
import DeckHeader from "../../../components/deck/DeckHeader";
import ManualAdd from "../../../components/deck/ManualAdd";
import DeckCardsTabs from "../../../components/deck/DeckCardsTabs";
import Card from "../../../components/Card";
import { evaluateDeckLegality } from "../../../services/Legalities";
import styles from "./page.module.css";

export default function DeckClient({
  deck,
  initialDeckCards,
  initialUserCollectionItems,
  wishlistLists,
  actions,
}) {
  // console.log(deck)
  const [deckState, setDeckState] = useState(deck); // { id, name, format, showcasedCard }
  const [deckCards, setDeckCards] = useState(initialDeckCards || []);
  const [enriched, setEnriched] = useState([]);     // cartes formatées  { deckCardId, decklistQuantity }
  const [tab, setTab] = useState("fromCollection"); // "fromCollection" | "manual" | "import"
  const [isPending, startTransition] = useTransition();
  const [deckColors, setDeckColors] = useState([]); // ["W","U","B","R","G","C"]

  // -------- Enrichissement Scryfall des cartes du deck --------
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!deckCards || deckCards.length === 0) {
        setEnriched([]);
        return;
      }
      try {
        const out = await Promise.all(
          deckCards.map(async (dc) => {
            const res = await fetch(`https://api.scryfall.com/cards/${dc.scryfallId}`, { cache: "no-store" });
            const raw = await res.json();
            const formatted = formatCard(raw);
            return {
              ...formatted,
              decklistQuantity: dc.quantity,
              deckCardId: dc.id,
            };
          })
        );
        if (!cancelled) setEnriched(out);
      } catch (e) {
        console.error("Erreur enrichissement Scryfall deck:", e);
        if (!cancelled) setEnriched([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [deckCards]);

  // Recalcule les couleurs du deck à partir des cartes présentes
  useEffect(() => {
    const set = new Set();
    // on s’appuie sur "enriched" + "deckCards" pour ne compter que les cartes présentes
    const qtyById = new Map(deckCards.map(dc => [dc.scryfallId, dc.quantity || 0]));
    enriched.forEach((c) => {
      const qty = qtyById.get(c.id) || 0;
      if (qty <= 0) return;
      if (c.type.includes("Basic Land")) return;      // ignore lands de base
      if (Array.isArray(c.colors)) {
        c.colors.forEach(clr => set.add(clr || "C"));
      }
      // fallback "incolore" si pas de colors mais cout de mana présent
      if ((!c.colors || c.colors.length === 0) && (c.manaCost || "").length > 0) {
        set.add("C");
      }
    });
    setDeckColors(Array.from(set));
  }, [enriched, deckCards]);

  // -------- LÉGALITÉ (résumé  marquage cartes) --------
  const legality = useMemo(() => {
    return evaluateDeckLegality(
      { format: deckState.format },
      deckCards,
      enriched,
     {
       // Optionnel : si un jour tu as l’ID scryfall du commandant pour Pauper Commander
       // commanderScryfallId: deckState.commanderScryfallId ?? null
     }
   );
  }, [deckState.format, deckCards, enriched]);

  const isCardProblematic = (card) => {
    return legality.issues.some((i) => i.scryfallId === card.id);
  };

  // -------- Handlers deck (server actions) --------
  const addCardToDeck = (scryfallId, qty = 1) => {
    startTransition(async () => {
      try {
        const res = await actions.addCardToDeck(deck.id, scryfallId, qty);
        if (!res?.item) return;
        const item = res.item; // { id, scryfallId, quantity }
        setDeckCards((prev) => {
          const idx = prev.findIndex((d) => d.scryfallId === item.scryfallId);
          if (idx === -1) return [{ id: item.id, scryfallId: item.scryfallId, quantity: item.quantity }, ...prev];
          const copy = [...prev];
          copy[idx] = { ...copy[idx], id: item.id, quantity: item.quantity };
          return copy;
        });
      } catch (e) {
        console.error("addCardToDeck error:", e);
      }
    });
  }

  const updateDeckCardQty = (deckCardId, nextQty) => {
    startTransition(async () => {
      try {
        const res = await actions.updateDeckCardQty(deckCardId, nextQty);
        if (!res) return;

        if (res.kind === "deleted") {
          setDeckCards((prev) => prev.filter((dc) => dc.id !== deckCardId));
        } else if (res.kind === "updated" && res.item) {
          setDeckCards((prev) =>
            prev.map((dc) => (dc.id === deckCardId ? { ...dc, quantity: res.item.quantity } : dc))
          );
        }
      } catch (e) {
        console.error("updateDeckCardQty error:", e);
      }
    });
  };

  const removeCardFromDeck = (deckCardId) => {
    startTransition(async () => {
      try {
        const res = await actions.removeCardFromDeck(deckCardId);
        if (res?.kind === "deleted") {
          setDeckCards((prev) => prev.filter((dc) => dc.id !== deckCardId));
        }
      } catch (e) {
        console.error("removeCardFromDeck error:", e);
      }
    });
  };

  const setShowcased = (deckCardId, artUrl) => {
    startTransition(async () => {
      try {
        const updated = await actions.setShowcasedCard(deckState.id, {
         deckCardId,
         artUrl,
       });
       setDeckState((prev) => ({
         ...prev,
         showcasedDeckCardId: updated.showcasedDeckCardId ?? null,
         showcasedArt: updated.showcasedArt ?? null,
       }));
      } catch (e) {
        console.error("setShowcased error:", e);
      }
    });
  };

  // Mise à jour locale depuis le panneau paramètres
  const applyDeckLocalUpdate = (partial) => {
    setDeckState((prev) => ({ ...prev, ...partial }));
  };

  return (
    <div id={styles.deckPage}>
      <div id={styles.deckManager} aria-busy={isPending}>
        <section id={styles.decklistOverview} style={{ display: "grid", gap: 16 }}>

        <DeckHeader deck={deckState} colors={deckColors} cards={enriched} />
        
        <DeckCardsTabs
          cards={enriched}
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
        <nav style={{ display: "flex", gap: 8, margin: "16px 0" }}>
          <button onClick={() => setTab("fromCollection")} disabled={tab === "fromCollection"}>Depuis la collection</button>
          <button onClick={() => setTab("manual")} disabled={tab === "manual"}>Ajout manuel</button>
          <button onClick={() => setTab("import")} disabled={tab === "import"}>Importer une liste</button>
        </nav>

        {tab === "fromCollection" && (
          <AddFromCollection
            deckId={deckState.id}
            collectionItems={initialUserCollectionItems}
            currentDeckCards={deckCards}
            onAdd={addCardToDeck}
          />
        )}

        {tab === "manual" && (
          <ManualAdd
            deckId={deckState.id}
            onAdd={(scryfallId, qty) => addCardToDeck(scryfallId, qty)}
          />
        )}

        {tab === "import" && (
          <div style={{ opacity: 0.6, padding: 12, border: "1px dashed #ccc", borderRadius: 8 }}>
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
  );
}