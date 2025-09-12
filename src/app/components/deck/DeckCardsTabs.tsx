'use client'
import { COLOR_META, TYPE_META } from '@/lib/mtgIcons'
import {
  buildColorSections,
  buildMvSections,
  buildNameList,
  buildTypeSections,
} from '@/lib/mtgSections'
import { useMemo } from 'react'
import { useDeckCardsPrefs } from '../../hooks/useDeckCardsPrefs'
import { useHoverPreview } from '../../hooks/useHoverPreview'
import { useLegalityIndex } from '../../hooks/useLegalityIndex'

import CardPreviewPopover from './CardPreviewPopover'
import ColsControl from './ColsControl'
import DeckPile from './DeckPile'
import DeckRow from './DeckRow'
import DeckTile from './DeckTile'
import SectionBlock from './SectionBlock'
import Masonry from './layout/Masonry'
import MultiCols from './layout/MultiCols'

import Image from 'next/image'
import styles from './DeckCardsTabs.module.css'

// Types
import type { MTGCard } from '@/types/games/magic'

interface DeckState {
  id: string
  name: string
  format: string
  showcasedCard?: any
  [key: string]: any
}

interface LegalityData {
  issues: Array<{ scryfallId: string; [key: string]: any }>
  [key: string]: any
}

interface DeckCardsTabsProps {
  cards: MTGCard[]
  deckState: DeckState
  isPending: boolean
  legality: LegalityData
  updateDeckCardQty: (deckCardId: string, qty: number) => void
  removeCardFromDeck: (deckCardId: string) => void
  setShowcased: (deckCardId: string, artUrl: string) => void
  isCardProblematic: (card: MTGCard) => boolean
  CardComponent?: any
}

interface ViewProps {
  cards: MTGCard[]
  deckState: DeckState
  isPending: boolean
  legality: LegalityData
  updateDeckCardQty: (deckCardId: string, qty: number) => void
  removeCardFromDeck: (deckCardId: string) => void
  setShowcased: (deckCardId: string, artUrl: string) => void
  editMode: boolean
  showLegality: boolean
  sortKey: string
  getRowHoverHandlers?: any
  gridCols?: number
  stackCols?: number
  listCols?: number
  compactCols?: number
  isCardProblematic?: (card: MTGCard) => boolean
}

/* =========================== TABS HOST =========================== */

export default function DeckCardsTabs(props: DeckCardsTabsProps) {
  // Wrapper function to convert setShowcased signature for DeckPile/DeckTile components
  const setShowcasedForPile = (payload: any) => {
    if (
      payload &&
      typeof payload === 'object' &&
      payload.deckCardId &&
      payload.artUrl
    ) {
      // Call the original setShowcased with the correct signature
      const originalSetShowcased = props.setShowcased as (
        deckCardId: string,
        artUrl: string
      ) => void
      originalSetShowcased(payload.deckCardId, payload.artUrl)
    }
  }

  const {
    prefs,
    setView,
    setEdit,
    setLegality,
    setSortKey,
    getCols,
    setCols,
    isColsEnabled,
  } = useDeckCardsPrefs()

  const {
    view: active,
    edit: editMode,
    legality: showLegality,
    sortKey,
  } = prefs

  const { preview, getRowHoverHandlers } = useHoverPreview()

  const VIEWS = useMemo(
    () => ({
      piles: { id: 'piles', label: 'Stack', render: DeckStacksView },
      grid: { id: 'grid', label: 'Grille', render: DeckGridView },
      list: { id: 'list', label: 'Liste', render: DeckListView },
      compact: { id: 'compact', label: 'Compact', render: DeckCompactView },
    }),
    []
  )

  const Current = VIEWS[active]?.render ?? VIEWS.grid.render

  return (
    <div className={styles.wrapper}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div
          className={styles.tabs}
          role="tablist"
          aria-label="Affichage des cartes"
        >
          {Object.values(VIEWS).map(v => (
            <button
              key={v.id}
              role="tab"
              type="button"
              aria-selected={active === v.id}
              className={`${styles.tab} ${active === v.id ? styles.activeTab : ''}`}
              onClick={() => setView(v.id as any)}
            >
              {v.label}
            </button>
          ))}
        </div>

        <ColsControl
          viewId={active}
          sortKey={sortKey}
          value={getCols(active)}
          onChange={(n: number) => setCols(active, n)}
          disabled={!isColsEnabled(active, sortKey)}
        />

        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={`${styles.editToggle} ${editMode ? styles.editOn : ''}`}
            aria-pressed={editMode}
            title={
              editMode ? 'Quitter le mode édition' : 'Activer le mode édition'
            }
            onClick={() => setEdit(!editMode)}
          >
            {editMode ? 'Édition' : 'Lecture'}
          </button>

          <button
            type="button"
            className={`${styles.legalityToggle} ${showLegality ? styles.legalityOn : ''}`}
            aria-pressed={showLegality}
            title={
              showLegality
                ? 'Masquer les problèmes de légalité'
                : 'Vérifier les légalités'
            }
            onClick={() => setLegality(!showLegality)}
          >
            {showLegality ? 'Légalité : ON' : 'Légalité : OFF'}
          </button>

          <label className={styles.sortWrapper} title="Option de tri">
            <span className={styles.sortLabel}>Trier&nbsp;:</span>
            <select
              className={styles.sortSelect}
              value={sortKey}
              onChange={e => setSortKey(e.target.value as any)}
            >
              <option value="mv">Coût converti</option>
              <option value="name">Nom</option>
              <option value="type">Type</option>
              <option value="color">Couleur</option>
            </select>
          </label>
        </div>
      </div>

      {/* Vue courante */}
      <div
        className={styles.panel}
        role="tabpanel"
        aria-label={VIEWS[active]?.label}
      >
        <Current
          {...props}
          setShowcased={setShowcasedForPile}
          editMode={editMode}
          showLegality={showLegality}
          sortKey={sortKey}
          getRowHoverHandlers={
            active === 'list' || active === 'compact'
              ? getRowHoverHandlers
              : undefined
          }
          gridCols={getCols('grid')}
          stackCols={getCols('piles')}
          listCols={getCols('list')}
          compactCols={getCols('compact')}
        />
      </div>

      <CardPreviewPopover preview={preview} />
    </div>
  )
}

/* ============================== VUE 1 : GRILLE =============================== */

function DeckGridView({
  cards,
  deckState,
  isPending,
  legality: _legality,
  updateDeckCardQty,
  removeCardFromDeck,
  setShowcased,
  isCardProblematic,
  editMode,
  showLegality,
  sortKey,
  gridCols = 2,
}: ViewProps) {
  const listByName = useMemo(() => buildNameList(cards as any), [cards])
  const { sections: mvSections, lands: mvLands } = useMemo(
    () => buildMvSections(cards as any),
    [cards]
  )
  const { sections: typeSections } = useMemo(
    () => buildTypeSections(cards as any),
    [cards]
  )
  const { sections: colorSections, lands: colorLands } = useMemo(
    () => buildColorSections(cards as any),
    [cards]
  )

  const renderTile = (card: MTGCard, i: number) => (
    <DeckTile
      key={(card as any).deckCardId || card.id || i}
      card={card}
      qty={Number((card as any).decklistQuantity || 0)}
      deckState={deckState}
      editMode={editMode}
      isPending={isPending}
      setShowcased={setShowcased}
      updateDeckCardQty={updateDeckCardQty}
      removeCardFromDeck={removeCardFromDeck}
      showLegality={showLegality}
      isProblem={showLegality && (isCardProblematic?.(card) ?? false)}
      onClickShowcase={() => {}}
    />
  )

  if (sortKey === 'name') {
    return <ul className={styles.grid}>{listByName.map(renderTile)}</ul>
  }

  if (sortKey === 'type') {
    return (
      <Masonry className={styles.masonryCols} cols={gridCols} style={{}}>
        {typeSections.map(sec => {
          const total = sec.items.reduce(
            (s: number, c: any) => s + Number(c?.decklistQuantity || 0),
            0
          )
          const meta = (TYPE_META as any)[sec.title] || {
            label: sec.title,
            icon: null,
          }
          return (
            <section key={sec.key} className={styles.typeSection}>
              <header className={styles.sectionHeader}>
                {meta.icon ? (
                  <Image
                    src={meta.icon}
                    alt={meta.label}
                    width={18}
                    height={18}
                    className={styles.sectionIcon}
                  />
                ) : (
                  <span className={styles.typeIconFallback}>•</span>
                )}
                <h3 className={styles.sectionTitle}>{meta.label}</h3>
                <span className={styles.sectionBadge}>×{total}</span>
              </header>
              <ul
                className={styles.overlapList}
                style={{
                  ['--tile-w' as any]: '180px',
                  ['--overlap' as any]: '200px',
                }}
              >
                {sec.items.map(renderTile)}
              </ul>
            </section>
          )
        })}
      </Masonry>
    )
  }

  if (sortKey === 'color') {
    return (
      <Masonry className={styles.listMasonry} cols={gridCols} style={{}}>
        {colorSections.map(sec => {
          const total = sec.items.reduce(
            (s: number, c: any) => s + Number(c?.decklistQuantity || 0),
            0
          )
          const k = sec.title
          const meta =
            (COLOR_META as any)[k] ||
            (k === 'M'
              ? { label: 'Multicolore', icon: null }
              : { label: k, icon: null })
          return (
            <section key={sec.key} className={styles.typeSection}>
              <header className={styles.sectionHeader}>
                {meta.icon ? (
                  <Image
                    src={meta.icon}
                    alt={meta.label}
                    width={18}
                    height={18}
                    className={styles.sectionIcon}
                  />
                ) : (
                  <span className={styles.typeIconFallback}>•</span>
                )}
                <h3 className={styles.sectionTitle}>{meta.label}</h3>
                <span className={styles.sectionBadge}>×{total}</span>
              </header>
              <ul
                className={styles.overlapList}
                style={{
                  ['--tile-w' as any]: '180px',
                  ['--overlap' as any]: '200px',
                }}
              >
                {sec.items.map(renderTile)}
              </ul>
            </section>
          )
        })}

        {colorLands.length > 0 && (
          <section className={styles.typeSection}>
            <header className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Terrains</h3>
              <span className={styles.sectionBadge}>
                ×
                {colorLands.reduce(
                  (s: number, c: any) => s + Number(c?.decklistQuantity || 0),
                  0
                )}
              </span>
            </header>
            <ul
              className={styles.overlapList}
              style={{
                ['--tile-w' as any]: '180px',
                ['--overlap' as any]: '200px',
              }}
            >
              {colorLands.map(renderTile)}
            </ul>
          </section>
        )}
      </Masonry>
    )
  }

  // mv (par défaut)
  const colsCount = mvSections.length || 1
  return (
    <div
      className={styles.gridByMV}
      style={{
        ['--cols' as any]: colsCount,
        ['--tile-w' as any]: '180px',
        ['--overlap' as any]: '200px',
      }}
    >
      {mvSections.map(sec => (
        <div key={sec.key} className={styles.gridColumn}>
          <ul className={styles.overlapList}>{sec.items.map(renderTile)}</ul>
        </div>
      ))}
      {mvLands.length > 0 && (
        <div className={styles.landsSection}>
          <div className={styles.landsHeader}>Terrains</div>
          <ul className={styles.pilesRow}>{mvLands.map(renderTile)}</ul>
        </div>
      )}
    </div>
  )
}

/* ============================== VUE 2 : LISTE ================================ */

function DeckListView({
  cards,
  deckState,
  isPending,
  legality,
  updateDeckCardQty,
  removeCardFromDeck,
  setShowcased,
  editMode,
  showLegality,
  sortKey, // "name" | "mv" | "type" | "color"
  getRowHoverHandlers,
  listCols = 2,
}: ViewProps) {
  const { issuesById } = useLegalityIndex(legality as any)

  const listByName = useMemo(() => buildNameList(cards as any), [cards])
  const mvData = useMemo(() => buildMvSections(cards), [cards])
  const typeData = useMemo(() => buildTypeSections(cards), [cards])
  const colorData = useMemo(() => buildColorSections(cards), [cards])

  const renderSections = (
    sections: any[],
    lands: any[],
    titleForLands = 'Terrains'
  ) => {
    const ordered = [
      ...sections,
      ...(lands.length
        ? [{ key: 'lands', title: titleForLands, items: lands }]
        : []),
    ]

    return (
      <Masonry className={styles.listMasonry} cols={listCols} style={{}}>
        {ordered.map(sec => {
          const count = sec.items.reduce(
            (s: number, c: any) => s + Number(c?.decklistQuantity || 0),
            0
          )
          const title = sec.key?.startsWith('type-')
            ? ((TYPE_META as any)?.[sec.title]?.label ?? sec.title)
            : sec.key?.startsWith('color-')
              ? ((COLOR_META as any)?.[sec.title]?.label ?? sec.title)
              : sec.title

          return (
            <SectionBlock
              key={sec.key || sec.title}
              title={title}
              count={count}
              icon={null}
            >
              <table className={styles.listTable}>
                <tbody>
                  {sec.items.map(
                    (
                      card: MTGCard & {
                        deckCardId: string
                        decklistQuantity: number
                      }
                    ) => (
                      <DeckRow
                        key={card.deckCardId || card.id}
                        variant="list"
                        card={card}
                        deckState={deckState}
                        editMode={editMode}
                        isPending={isPending}
                        showLegality={showLegality}
                        updateDeckCardQty={updateDeckCardQty}
                        removeCardFromDeck={removeCardFromDeck}
                        setShowcased={setShowcased}
                        getRowHoverHandlers={getRowHoverHandlers}
                        problems={issuesById.get(card.id) || ([] as any)}
                      />
                    )
                  )}
                </tbody>
              </table>
            </SectionBlock>
          )
        })}
      </Masonry>
    )
  }

  if (sortKey === 'name') {
    return (
      <MultiCols
        items={listByName}
        cols={listCols}
        className={styles.listCols}
        style={{}}
        render={(col: any) => (
          <table className={styles.listTable}>
            <tbody>
              {col.map(
                (
                  card: MTGCard & {
                    deckCardId: string
                    decklistQuantity: number
                  }
                ) => (
                  <DeckRow
                    key={card.deckCardId || card.id}
                    variant="list"
                    card={card}
                    deckState={deckState}
                    editMode={editMode}
                    isPending={isPending}
                    showLegality={showLegality}
                    updateDeckCardQty={updateDeckCardQty}
                    removeCardFromDeck={removeCardFromDeck}
                    setShowcased={setShowcased}
                    getRowHoverHandlers={getRowHoverHandlers}
                    problems={issuesById.get(card.id) || ([] as any)}
                  />
                )
              )}
            </tbody>
          </table>
        )}
      />
    )
  }

  if (sortKey === 'mv')
    return renderSections(mvData.sections, mvData.lands, 'Terrains')
  if (sortKey === 'type')
    return renderSections(
      typeData.sections,
      typeData.lands,
      (TYPE_META as any)?.land?.label ?? 'Terrains'
    )
  return renderSections(colorData.sections, colorData.lands, 'Terrains')
}

/* ============================ VUE 3 : COMPACT ================================ */

function DeckCompactView({
  cards,
  deckState,
  isPending,
  legality,
  updateDeckCardQty,
  removeCardFromDeck,
  setShowcased,
  editMode,
  showLegality,
  sortKey, // "name" | "mv" | "type" | "color"
  getRowHoverHandlers,
  compactCols = 2,
}: ViewProps) {
  const { issuesById } = useLegalityIndex(legality as any)

  const listByName = useMemo(() => buildNameList(cards as any), [cards])
  const mvData = useMemo(() => buildMvSections(cards), [cards])
  const typeData = useMemo(() => buildTypeSections(cards), [cards])
  const colorData = useMemo(() => buildColorSections(cards), [cards])

  const renderSections = (
    sections: any[],
    lands: any[],
    titleForLands = 'Terrains'
  ) => {
    const ordered = [
      ...sections,
      ...(lands.length
        ? [{ key: 'lands', title: titleForLands, items: lands }]
        : []),
    ]

    return (
      <Masonry className={styles.listMasonry} cols={compactCols} style={{}}>
        {ordered.map(sec => {
          const count = sec.items.reduce(
            (s: number, c: any) => s + Number(c?.decklistQuantity || 0),
            0
          )
          const title = sec.key?.startsWith('type-')
            ? ((TYPE_META as any)?.[sec.title]?.label ?? sec.title)
            : sec.key?.startsWith('color-')
              ? ((COLOR_META as any)?.[sec.title]?.label ?? sec.title)
              : sec.title

          return (
            <SectionBlock key={sec.key} title={title} count={count} icon={null}>
              <table className={styles.sectionTable}>
                <tbody>
                  {sec.items.map(
                    (
                      card: MTGCard & {
                        deckCardId: string
                        decklistQuantity: number
                      }
                    ) => (
                      <DeckRow
                        key={card.deckCardId || card.id}
                        variant="compact"
                        card={card}
                        deckState={deckState}
                        editMode={editMode}
                        isPending={isPending}
                        showLegality={showLegality}
                        updateDeckCardQty={updateDeckCardQty}
                        removeCardFromDeck={removeCardFromDeck}
                        setShowcased={setShowcased}
                        getRowHoverHandlers={getRowHoverHandlers}
                        problems={issuesById.get(card.id) || ([] as any)}
                      />
                    )
                  )}
                </tbody>
              </table>
            </SectionBlock>
          )
        })}
      </Masonry>
    )
  }

  if (sortKey === 'name') {
    return (
      <MultiCols
        items={listByName}
        cols={compactCols}
        className={styles.listCols}
        style={{}}
        render={(col: any) => (
          <table className={styles.listTable}>
            <tbody>
              {col.map(
                (
                  card: MTGCard & {
                    deckCardId: string
                    decklistQuantity: number
                  }
                ) => (
                  <DeckRow
                    key={card.deckCardId || card.id}
                    variant="compact"
                    card={card}
                    deckState={deckState}
                    editMode={editMode}
                    isPending={isPending}
                    showLegality={showLegality}
                    updateDeckCardQty={updateDeckCardQty}
                    removeCardFromDeck={removeCardFromDeck}
                    setShowcased={setShowcased}
                    getRowHoverHandlers={getRowHoverHandlers}
                    problems={issuesById.get(card.id) || ([] as any)}
                  />
                )
              )}
            </tbody>
          </table>
        )}
      />
    )
  }

  if (sortKey === 'mv')
    return renderSections(mvData.sections, mvData.lands, 'Terrains')
  if (sortKey === 'type')
    return renderSections(
      typeData.sections,
      typeData.lands,
      (TYPE_META as any)?.land?.label ?? 'Terrains'
    )
  return renderSections(colorData.sections, colorData.lands, 'Terrains')
}

/* ============================== VUE 4 : PILES ================================ */

function DeckStacksView({
  cards,
  deckState,
  isPending,
  legality,
  updateDeckCardQty,
  removeCardFromDeck,
  setShowcased,
  editMode,
  showLegality,
  sortKey,
  stackCols = 2,
}: ViewProps) {
  // Config d’affichage pour DeckPile
  const CARD_W = 140
  const CARD_H = 200
  const OFFSET_Y = 20
  const VISIBLE_CAP = Number.POSITIVE_INFINITY
  const pileCfg = { CARD_W, CARD_H, OFFSET_Y, CAP: VISIBLE_CAP }

  const { issuesById } = useLegalityIndex(legality as any)

  const listByName = useMemo(() => buildNameList(cards as any), [cards])
  const { sections: mvSections, lands: mvLands } = useMemo(
    () => buildMvSections(cards as any),
    [cards]
  )
  const { sections: typeSections } = useMemo(
    () => buildTypeSections(cards as any),
    [cards]
  )
  const { sections: colorSections, lands: colorLands } = useMemo(
    () => buildColorSections(cards as any),
    [cards]
  )

  const renderPile = (card: MTGCard) => {
    const problems = issuesById.get(card.id) || ([] as any)
    const isProblem = showLegality && problems.length > 0
    return (
      <DeckPile
        key={(card as any).deckCardId || card.id}
        card={card}
        qty={Number((card as any).decklistQuantity || 0)}
        deckState={deckState}
        editMode={editMode}
        isPending={isPending}
        setShowcased={setShowcased}
        updateDeckCardQty={updateDeckCardQty}
        removeCardFromDeck={removeCardFromDeck}
        showLegality={showLegality}
        problems={problems}
        isProblem={isProblem}
        config={pileCfg}
      />
    )
  }

  if (sortKey === 'name') {
    return (
      <ul
        className={styles.pilesFlow}
        style={{
          ['--card-w' as any]: `${CARD_W}px`,
          ['--card-h' as any]: `${CARD_H}px`,
        }}
      >
        {listByName.map(renderPile)}
      </ul>
    )
  }

  if (sortKey === 'type') {
    return (
      <Masonry className={styles.listMasonry} cols={stackCols} style={{}}>
        {typeSections.map(sec => {
          const total = sec.items.reduce(
            (s: number, c: any) => s + Number(c?.decklistQuantity || 0),
            0
          )
          const meta = (TYPE_META as any)[sec.title] || {
            label: sec.title,
            icon: null,
          }
          return (
            <section key={sec.key} className={styles.typeSection}>
              <header className={styles.sectionHeader}>
                {meta.icon ? (
                  <Image
                    src={meta.icon}
                    alt={meta.label}
                    width={18}
                    height={18}
                    className={styles.sectionIcon}
                  />
                ) : (
                  <span className={styles.typeIconFallback}>•</span>
                )}
                <h3 className={styles.sectionTitle}>{meta.label}</h3>
                <span className={styles.sectionBadge}>×{total}</span>
              </header>
              <ul className={styles.pilesRow}>{sec.items.map(renderPile)}</ul>
            </section>
          )
        })}
      </Masonry>
    )
  }

  if (sortKey === 'color') {
    return (
      <Masonry className={styles.listMasonry} cols={stackCols} style={{}}>
        {colorSections.map(sec => {
          const total = sec.items.reduce(
            (s: number, c: any) => s + Number(c?.decklistQuantity || 0),
            0
          )
          const k = sec.title
          const meta =
            (COLOR_META as any)[k] ||
            (k === 'M'
              ? { label: 'Multicolore', icon: null }
              : { label: k, icon: null })
          return (
            <section key={sec.key} className={styles.typeSection}>
              <header className={styles.sectionHeader}>
                {meta.icon ? (
                  <Image
                    src={meta.icon}
                    alt={meta.label}
                    width={18}
                    height={18}
                    className={styles.sectionIcon}
                  />
                ) : (
                  <span className={styles.typeIconFallback}>•</span>
                )}
                <h3 className={styles.sectionTitle}>{meta.label}</h3>
                <span className={styles.sectionBadge}>×{total}</span>
              </header>
              <ul className={styles.pilesRow}>{sec.items.map(renderPile)}</ul>
            </section>
          )
        })}

        {colorLands.length > 0 && (
          <section className={styles.typeSection}>
            <header className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Terrains</h3>
              <span className={styles.sectionBadge}>
                ×
                {colorLands.reduce(
                  (s: number, c: any) => s + Number(c?.decklistQuantity || 0),
                  0
                )}
              </span>
            </header>
            <ul className={styles.pilesRow}>{colorLands.map(renderPile)}</ul>
          </section>
        )}
      </Masonry>
    )
  }

  // mv (par défaut)
  const colsCount = mvSections.length || 1
  return (
    <div
      className={styles.pilesByMV}
      style={{
        ['--cols' as any]: colsCount,
        ['--card-w' as any]: `${CARD_W}px`,
        ['--card-h' as any]: `${CARD_H}px`,
      }}
    >
      {mvSections.map(sec => (
        <div key={sec.key} className={styles.mvColumn}>
          <ul className={styles.pilesList}>{sec.items.map(renderPile)}</ul>
        </div>
      ))}

      {mvLands.length > 0 && (
        <div className={styles.landsSection}>
          <div className={styles.landsHeader}>Terrains</div>
          <ul className={styles.landsRow}>{mvLands.map(renderPile)}</ul>
        </div>
      )}
    </div>
  )
}
