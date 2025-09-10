'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import styles from './WishlistSearchSection.module.css'
import Card from './Card'
import { formatCard } from '../services/FormatCard'

export default function WishlistSearchSection({
  userId,
  wishlistLists,
  StopAddingToWishlist,
  wishlistId,
  onHoverCard,
  onCardAdded,
}) {
  const [searchInput, setSearchInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)

  // Empêche l’autocomplete de se rouvrir juste après un clic sur une suggestion (cas "Opt")
  const [freezeAutocomplete, setFreezeAutocomplete] = useState(false)

  // UI: position du popover
  const [placement, setPlacement] = useState('right') // "right" | "left" | "bottom"
  const [drawerStyle, setDrawerStyle] = useState({})
  const drawerRef = useRef(null)

  const abortRef = useRef(null)
  const hoverAbortRef = useRef(null)

  const debouncedQuery = useDebounce(searchInput, 220)

  /* ---------- positionnement du popover ---------- */
  const reposition = () => {
    if (!drawerRef.current) return
    const parent = drawerRef.current.parentElement // le conteneur de la tuile placeholder
    if (!parent) return

    const rect = parent.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const m = 12
    const desiredW = Math.min(720, Math.max(360, vw - 2 * m))

    // défaut: à droite
    let nextPlacement = 'right'
    let left = rect.right + m
    let top = Math.min(Math.max(rect.top, m), vh - m - 120)
    let width = desiredW

    // pas de place à droite -> essayer gauche
    if (left + desiredW > vw - m) {
      const leftOption = rect.left - m - desiredW
      if (leftOption >= m) {
        nextPlacement = 'left'
        left = leftOption
      } else {
        // ni droite ni gauche -> dessous
        nextPlacement = 'bottom'
        left = Math.min(Math.max(rect.left, m), vw - desiredW - m)
        top = rect.bottom + m
      }
    }

    setPlacement(nextPlacement)
    setDrawerStyle({
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      maxHeight: `min(80vh, ${vh - 2 * m}px)`,
    })
  }

  useLayoutEffect(() => {
    reposition()
  }, [])

  useEffect(() => {
    const onScroll = () => reposition()
    const onResize = () => reposition()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  /* ---------- fermeture: esc + clic-extérieur ---------- */
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') StopAddingToWishlist?.()
    }
    const onClick = e => {
      if (!drawerRef.current) return
      if (!drawerRef.current.contains(e.target)) {
        StopAddingToWishlist?.()
      }
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [StopAddingToWishlist])

  /* ---------- autocomplete (avec gel si besoin) ---------- */
  useEffect(() => {
    const q = debouncedQuery.trim()
    setHighlightIndex(-1)

    if (freezeAutocomplete) {
      setSuggestions([])
      return
    }

    if (q.length < 3) {
      setSuggestions([])
      return
    }

    ;(async () => {
      try {
        if (abortRef.current) abortRef.current.abort()
        abortRef.current = new AbortController()

        const res = await fetch(
          `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}`,
          { signal: abortRef.current.signal }
        )
        const data = await res.json()
        setSuggestions(Array.isArray(data?.data) ? data.data.slice(0, 15) : [])
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.error('Erreur chargement suggestions:', error)
        }
      }
    })()
  }, [debouncedQuery, freezeAutocomplete])

  /* ---------- résultats généraux ---------- */
  const handleSearch = async query => {
    const q = (query ?? searchInput).trim()
    if (!q) return

    setLoading(true)
    setSuggestions([]) // ferme la liste
    setHighlightIndex(-1)

    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&unique=prints`
      )
      const data = await res.json()
      const formattedResults = Array.isArray(data?.data)
        ? data.data.map(formatCard)
        : []
      setSearchResults(formattedResults)
    } catch (error) {
      console.error('Erreur chargement résultats:', error)
    } finally {
      setLoading(false)
    }
  }

  /* ---------- prints EXACTS après clic sur une suggestion ---------- */
  const handleSearchExactPrints = async exactName => {
    // 1) on gèle l’autocomplete pour éviter qu’il se rouvre (cas "Opt")
    setFreezeAutocomplete(true)
    setSuggestions([])
    setSearchResults([])
    setHighlightIndex(-1)
    setSearchInput(exactName)

    setLoading(true)
    try {
      // Récupère la carte exacte puis son prints_search_uri
      const namedRes = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(exactName)}`
      )
      const named = await namedRes.json()
      const printsUrl = named?.prints_search_uri
      if (printsUrl) {
        const printsRes = await fetch(
          `${printsUrl}&order=released&unique=prints`
        )
        const printsData = await printsRes.json()
        const formatted = Array.isArray(printsData?.data)
          ? printsData.data.map(formatCard)
          : []
        setSearchResults(formatted)
      } else {
        // fallback – très rare
        await handleSearch(`!"${exactName}"`)
      }
    } catch (error) {
      console.error('Erreur chargement prints exacts:', error)
    } finally {
      setLoading(false)
    }
  }

  /* ---------- ajout wishlist ---------- */
  const handleAddToSpecificWishlist = async card => {
    if (!userId || !wishlistId) return

    try {
      const addRes = await fetch(
        `/api/users/${userId}/wishlist/lists/${wishlistId}/items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scryfallId: card.id, quantity: 1 }),
        }
      )

      if (!addRes.ok) throw new Error("Erreur lors de l'ajout à la wishlist")
      onCardAdded?.()
    } catch (error) {
      console.error('❌ Erreur ajout carte à wishlist :', error)
    }
  }

  /* ---------- clavier sur l’input ---------- */
  const onInputKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0 && highlightIndex >= 0) {
        const choice = suggestions[highlightIndex]
        handleSearchExactPrints(choice)
      } else {
        setFreezeAutocomplete(false)
        handleSearch(searchInput)
      }
    } else if (e.key === 'Escape') {
      setSuggestions([])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (suggestions.length) {
        setHighlightIndex(i => Math.min(i + 1, suggestions.length - 1))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (suggestions.length) {
        setHighlightIndex(i => Math.max(i - 1, 0))
      }
    }
  }

  /* ---------- hover preview sur suggestions ---------- */
  const onSuggestionHover = async name => {
    try {
      if (hoverAbortRef.current) hoverAbortRef.current.abort()
      hoverAbortRef.current = new AbortController()

      const res = await fetch(
        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`,
        { signal: hoverAbortRef.current.signal }
      )
      const card = await res.json()
      const formatted = formatCard(card)
      const image = formatted?.image?.small || formatted?.image_uris?.small
      if (image) onHoverCard?.(image)
    } catch (e) {
      if (e?.name !== 'AbortError')
        console.error('Erreur chargement image hover', e)
    }
  }

  return (
    <section
      className={[
        styles.drawer,
        placement === 'left'
          ? styles.placeLeft
          : placement === 'bottom'
            ? styles.placeBottom
            : styles.placeRight,
      ].join(' ')}
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      style={drawerStyle}
    >
      <div className={styles.topBar}>
        <div className={styles.inputWrap}>
          <span className={styles.searchIcon} aria-hidden>
            🔎
          </span>
          <input
            type="text"
            placeholder="Rechercher une carte (≥ 3 lettres)"
            value={searchInput}
            onChange={e => {
              setFreezeAutocomplete(false) // l’utilisateur retape → on réactive l’autocomplete
              setSearchInput(e.target.value)
            }}
            onKeyDown={onInputKeyDown}
            aria-autocomplete="list"
            aria-expanded={suggestions.length > 0}
            aria-label="Rechercher une carte"
          />
          {searchInput && (
            <button
              className={styles.clearBtn}
              title="Effacer"
              onClick={() => {
                setSearchInput('')
                setSuggestions([])
                setSearchResults([])
                setFreezeAutocomplete(false)
                onHoverCard?.(null)
              }}
            >
              ×
            </button>
          )}
        </div>

        <button
          className={styles.searchBtn}
          onClick={() => {
            setFreezeAutocomplete(false)
            handleSearch(searchInput)
          }}
        >
          Rechercher
        </button>

        <button
          className={styles.closeBtn}
          onClick={StopAddingToWishlist}
          aria-label="Fermer la recherche"
          title="Fermer"
        >
          ✕
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <ul
          className={styles.suggestionList}
          role="listbox"
          aria-label="Suggestions"
        >
          {suggestions.map((s, index) => (
            <li
              key={`${s}-${index}`}
              role="option"
              className={index === highlightIndex ? styles.active : undefined}
              onMouseEnter={() => onSuggestionHover(s)}
              onMouseLeave={() => onHoverCard?.(null)}
              onClick={() => handleSearchExactPrints(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      {/* Résultats */}
      <div className={styles.contentArea}>
        {loading && (
          <div className={styles.loading}>Chargement des cartes…</div>
        )}

        {!loading && searchResults.length > 0 && (
          <>
            <div className={styles.resultsHeader}>
              <span>{searchResults.length} résultat(s)</span>
            </div>

            <ul className={styles.cardResults}>
              {searchResults.map((card, index) => (
                <li
                  key={card.id ?? index}
                  className={styles.cardResultsItem}
                  onMouseEnter={() => {
                    const img = card?.image?.small || card?.image_uris?.small
                    if (img) onHoverCard?.(img)
                  }}
                  onMouseLeave={() => onHoverCard?.(null)}
                >
                  <Card
                    card={card}
                    currentIndex={index}
                    cardList={searchResults}
                    modal
                    name
                  />
                  <div className={styles.btnRow}>
                    <button onClick={() => handleAddToSpecificWishlist(card)}>
                      Ajouter à la wishlist
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {!loading && searchResults.length === 0 && !suggestions.length && (
          <div className={styles.empty}>
            Tape au moins 3 lettres pour voir les suggestions, ou lance une
            recherche.
          </div>
        )}
      </div>
    </section>
  )
}

/* --------- utils --------- */
function useDebounce(value, delay = 250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}
