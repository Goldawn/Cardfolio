"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { formatCard } from "@/app/services/FormatCard";
import styles from "./AddFromCollection.module.css"

export default function ManualAdd({
  deckId,
  onAdd,                 // (scryfallId, qty) => Promise
  defaultQty = 1,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);     // cartes formatées
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [qtyById, setQtyById] = useState({});
  const [isPending, startTransition] = useTransition();
  const abortRef = useRef(null);

  const debouncedQuery = useDebounce(query, 350);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults([]);
      setError("");
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      abortRef.current?.abort?.();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        // Scryfall: recherche textuelle. Tu peux enrichir la requête avec des opérateurs (t:creature, set:woe…)
        const res = await fetch(
          `https://api.scryfall.com/cards/search?q=${encodeURIComponent(debouncedQuery)}`,
          { cache: "no-store", signal: ctrl.signal }
        );

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Erreur Scryfall");
        }

        const data = await res.json();
        if (cancelled) return;

        const formatted = (data?.data || []).map(formatCard);
        setResults(formatted);
      } catch (e) {
        if (!cancelled && e.name !== "AbortError") {
          console.error("Recherche Scryfall:", e);
          setError("Impossible d'effectuer la recherche. Réessaie.");
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      abortRef.current?.abort?.();
    };
  }, [debouncedQuery]);

  const handleQtyChange = (scryfallId, value) => {
    const v = Math.max(1, Math.min(99, Number(value) || 1));
    setQtyById((prev) => ({ ...prev, [scryfallId]: v }));
  };

  const addOne = (scryfallId) => {
    const qty = qtyById[scryfallId] ?? defaultQty;
    startTransition(async () => {
      try {
        await onAdd(scryfallId, qty);
        setQtyById((prev) => ({ ...prev, [scryfallId]: defaultQty }));
      } catch (e) {
        console.error("Erreur ajout manuel:", e);
      }
    });
  };

  return (
    <section id={styles.ManualAdd}>
      <h3>Ajout manuel</h3>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Rechercher sur Scryfall… (ex: lightning bolt, set:woe, t:creature)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      {loading && <p style={{ opacity: 0.7 }}>Recherche en cours…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!loading && results.length > 0 && (
        <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {results.map((c) => (
            <li key={c.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <img
                  src={c.image?.small || c.image?.normal}
                  alt={c.name}
                  style={{ width: 80, height: "auto", borderRadius: 4 }}
                />
                <div style={{ flex: 1 }}>
                  <strong>{c.name}</strong>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {c.setCode?.toUpperCase()} • {c.typeLine}
                  </div>

                  <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={qtyById[c.id] ?? defaultQty}
                      onChange={(e) => handleQtyChange(c.id, e.target.value)}
                      style={{ width: 64 }}
                    />
                    <button onClick={() => addOne(c.id)} disabled={isPending}>
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && debouncedQuery && results.length === 0 && !error && (
        <p style={{ opacity: 0.7 }}>Aucun résultat.</p>
      )}
    </section>
  );
}

/** Petit hook de debounce générique */
function useDebounce(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
