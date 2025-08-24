"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { formatCard } from "@/app/services/FormatCard";
import styles from "./AddFromCollection.module.css";

export default function AddFromCollection({
  deckId,
  collectionItems,          // [{ scryfallId, quantity }]
  currentDeckCards,          // [{ scryfallId, quantity }] pour caper si besoin
  onAdd,                     // (scryfallId, qty) => Promise
}) {

    console.log(collectionItems)
  const [isPending, startTransition] = useTransition();
  const [enriched, setEnriched] = useState([]); // [{...formatted, ownedQuantity}]
  const [query, setQuery] = useState("");
  const [respectOwned, setRespectOwned] = useState(true);
  const [qtyById, setQtyById] = useState({}); // { scryfallId: number }

  // map des quantités déjà dans le deck (pour cap si respectOwned)
  const inDeckMap = useMemo(() => {
    const m = new Map();
    (currentDeckCards || []).forEach(dc => {
      m.set(dc.scryfallId, (m.get(dc.scryfallId) || 0) + (dc.quantity || 0));
    });
    return m;
  }, [currentDeckCards]);

  // Enrichissement via /cards/collection (bulk)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!collectionItems || collectionItems.length === 0) {
        setEnriched([]);
        return;
      }
      try {
        // Scryfall bulk: 75 identifiants max par requête → on chunk si besoin
        const chunkSize = 75;
        const chunks = [];
        for (let i = 0; i < collectionItems.length; i += chunkSize) {
          chunks.push(collectionItems.slice(i, i + chunkSize));
        }
        const all = [];
        for (const chunk of chunks) {
          const body = {
            identifiers: chunk.map(it => ({ id: it.scryfallId })),
          };
          const res = await fetch("https://api.scryfall.com/cards/collection", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
          });
          const data = await res.json();
          const formatted = (data?.data || []).map(raw => formatCard(raw));
          // rattache ownedQuantity
          formatted.forEach(f => {
            const owned = collectionItems.find(ci => ci.scryfallId === f.id)?.quantity || 0;
            all.push({ ...f, ownedQuantity: owned });
          });
        }
        if (!cancelled) setEnriched(all);
      } catch (e) {
        console.error("Erreur enrichissement collection:", e);
        if (!cancelled) setEnriched([]);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [collectionItems]);

  const filtered = useMemo(() => {
    if (!query) return enriched;
    const q = query.toLowerCase();
    return enriched.filter(c =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.setCode || "").toLowerCase().includes(q)
    );
  }, [enriched, query]);

  const handleQtyChange = (scryfallId, value) => {
    const v = Math.max(1, Math.min(99, Number(value) || 1));
    setQtyById(prev => ({ ...prev, [scryfallId]: v }));
  };

  const addOne = (scryfallId) => {
    const wanted = qtyById[scryfallId] ?? 1;
    const owned = collectionItems.find(ci => ci.scryfallId === scryfallId)?.quantity || 0;
    const inDeck = inDeckMap.get(scryfallId) || 0;
    let qty = wanted;

    if (respectOwned) {
      const remaining = Math.max(0, owned - inDeck);
      qty = Math.min(qty, remaining);
      if (qty <= 0) return; // rien à ajouter si on respecte le cap
    }

    startTransition(async () => {
      try {
        await onAdd(scryfallId, qty);
        // Option: reset quantité à 1
        setQtyById(prev => ({ ...prev, [scryfallId]: 1 }));
      } catch (e) {
        console.error("Erreur ajout carte depuis collection:", e);
      }
    });
  };

  return (
    <section id={styles.addFromCollection}>
      <h3>Ajouter depuis la collection</h3>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Rechercher une carte (nom ou set code)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            type="checkbox"
            checked={respectOwned}
            onChange={(e) => setRespectOwned(e.target.checked)}
          />
          Ne pas dépasser possédé
        </label>
      </div>

      <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        {filtered.map((c) => {
          const inDeck = inDeckMap.get(c.id) || 0;
          const remaining = Math.max(0, (c.ownedQuantity || 0) - inDeck);
          const disabled = respectOwned && remaining <= 0;

          return (
            <li key={c.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <img src={c.image?.small || c.image?.normal} alt={c.name} style={{ width: 80, height: "auto", borderRadius: 4 }} />
                <div style={{ flex: 1 }}>
                  <strong>{c.name}</strong>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {c.setCode?.toUpperCase()} • Possédé : {c.ownedQuantity} • Dans le deck : {inDeck}
                  </div>

                  <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={qtyById[c.id] ?? 1}
                      onChange={(e) => handleQtyChange(c.id, e.target.value)}
                      style={{ width: 64 }}
                    />
                    <button onClick={() => addOne(c.id)} disabled={isPending || disabled}>
                      {disabled ? "Max atteint" : "Ajouter"}
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li style={{ opacity: 0.7 }}>Aucune carte trouvée.</li>
        )}
      </ul>
    </section>
  );
}
