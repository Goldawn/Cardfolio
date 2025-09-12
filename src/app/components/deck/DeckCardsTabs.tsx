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
import type {
  BaseViewProps,
  DeckCard,
  DeckCardHandlers,
  DeckSection,
  DeckViewType,
} from '@/types/utils/helpers'
import {
  calculateSectionTotal,
  convertToDeckSections,
  createCardProps,
  createSectionWithLands,
  getSectionMeta,
} from '@/types/utils/helpers'

interface DeckState {
  id: string
  name: string
  format: string
  showcasedCard?: any
  [key: string]: any
}

interface LegalityData {
  issues: Array<{ externalId: string; [key: string]: any }>
  [key: string]: any
}

interface DeckCardsTabsProps extends DeckCardHandlers {
  cards: DeckCard[]
  deckState: DeckState
  isPending: boolean
  legality: LegalityData
  CardComponent?: any
}

interface ViewProps extends BaseViewProps {
  getRowHoverHandlers?: any
  gridCols?: number
  stackCols?: number
  listCols?: number
  compactCols?: number
  isCardProblematic?: (card: DeckCard) => boolean
}

/* =========================== HELPERS =========================== */

// Helper pour rendre une section avec métadonnées
const renderSection = (
  section: any,
  renderCards: (cards: DeckCard[]) => React.ReactNode,
  typeMeta: any,
  colorMeta: any
) => {
  const total = calculateSectionTotal(section.items)
  const meta = getSectionMeta(section.key, section.title, typeMeta, colorMeta)

  return (
    <section key={section.key} className={styles.typeSection}>
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
      {renderCards(section.items)}
    </section>
  )
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
      piles: {
        id: 'piles' as DeckViewType,
        label: 'Stack',
        render: DeckStacksView,
      },
      grid: {
        id: 'grid' as DeckViewType,
        label: 'Grille',
        render: DeckGridView,
      },
      list: {
        id: 'list' as DeckViewType,
        label: 'Liste',
        render: DeckListView,
      },
      compact: {
        id: 'compact' as DeckViewType,
        label: 'Compact',
        render: DeckCompactView,
      },
    }),
    []
  )

  const Current = VIEWS[active as DeckViewType]?.render ?? VIEWS.grid.render

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
  const listByName = useMemo(() => buildNameList(cards), [cards])
  const mvData = useMemo(
    () => convertToDeckSections(buildMvSections(cards)),
    [cards]
  )
  const typeData = useMemo(
    () => convertToDeckSections(buildTypeSections(cards)),
    [cards]
  )
  const colorData = useMemo(
    () => convertToDeckSections(buildColorSections(cards)),
    [cards]
  )

  const handlers: DeckCardHandlers = {
    updateDeckCardQty,
    removeCardFromDeck,
    setShowcased,
    isCardProblematic: isCardProblematic || (() => false),
  }

  const renderTile = (card: DeckCard, _i: number) => {
    const cardProps = createCardProps(
      card,
      deckState,
      editMode,
      isPending,
      showLegality,
      handlers
    )
    return <DeckTile {...cardProps} onClickShowcase={() => {}} />
  }

  if (sortKey === 'name') {
    return <ul className={styles.grid}>{listByName.map(renderTile)}</ul>
  }

  if (sortKey === 'type') {
    return (
      <Masonry className={styles.masonryCols} cols={gridCols} style={{}}>
        {typeData.sections.map(sec =>
          renderSection(
            sec,
            cards => (
              <ul
                className={styles.overlapList}
                style={{
                  ['--tile-w' as any]: '180px',
                  ['--overlap' as any]: '200px',
                }}
              >
                {cards.map(renderTile)}
              </ul>
            ),
            TYPE_META,
            COLOR_META
          )
        )}
      </Masonry>
    )
  }

  if (sortKey === 'color') {
    const sectionsWithLands = createSectionWithLands(
      colorData.sections,
      colorData.lands,
      'Terrains'
    )

    return (
      <Masonry className={styles.listMasonry} cols={gridCols} style={{}}>
        {sectionsWithLands.map(sec =>
          renderSection(
            sec,
            cards => (
              <ul
                className={styles.overlapList}
                style={{
                  ['--tile-w' as any]: '180px',
                  ['--overlap' as any]: '200px',
                }}
              >
                {cards.map(renderTile)}
              </ul>
            ),
            TYPE_META,
            COLOR_META
          )
        )}
      </Masonry>
    )
  }

  // mv (par défaut)
  const colsCount = mvData.sections.length || 1
  return (
    <div
      className={styles.gridByMV}
      style={{
        ['--cols' as any]: colsCount,
        ['--tile-w' as any]: '180px',
        ['--overlap' as any]: '200px',
      }}
    >
      {mvData.sections.map(sec => (
        <div key={sec.key} className={styles.gridColumn}>
          <ul className={styles.overlapList}>{sec.items.map(renderTile)}</ul>
        </div>
      ))}
      {mvData.lands.length > 0 && (
        <div className={styles.landsSection}>
          <div className={styles.landsHeader}>Terrains</div>
          <ul className={styles.pilesRow}>{mvData.lands.map(renderTile)}</ul>
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
  isCardProblematic,
}: ViewProps) {
  const { issuesById } = useLegalityIndex(legality as any)

  const listByName = useMemo(() => buildNameList(cards), [cards])
  const mvData = useMemo(
    () => convertToDeckSections(buildMvSections(cards)),
    [cards]
  )
  const typeData = useMemo(
    () => convertToDeckSections(buildTypeSections(cards)),
    [cards]
  )
  const colorData = useMemo(
    () => convertToDeckSections(buildColorSections(cards)),
    [cards]
  )

  const handlers: DeckCardHandlers = {
    updateDeckCardQty,
    removeCardFromDeck,
    setShowcased,
    isCardProblematic: isCardProblematic || (() => false),
  }

  const renderSections = (
    sections: DeckSection[],
    lands: DeckCard[],
    titleForLands = 'Terrains'
  ) => {
    const ordered = createSectionWithLands(sections, lands, titleForLands)

    return (
      <Masonry className={styles.listMasonry} cols={listCols} style={{}}>
        {ordered.map(sec => {
          const count = calculateSectionTotal(sec.items)
          const meta = getSectionMeta(sec.key, sec.title, TYPE_META, COLOR_META)

          return (
            <SectionBlock
              key={sec.key}
              title={meta.label}
              count={count}
              icon={null}
            >
              <table className={styles.listTable}>
                <tbody>
                  {sec.items.map(card => {
                    const cardProps = createCardProps(
                      card,
                      deckState,
                      editMode,
                      isPending,
                      showLegality,
                      handlers,
                      issuesById.get(card.id) || []
                    )
                    return (
                      <DeckRow
                        key={card.deckCardId || card.id}
                        variant="list"
                        {...cardProps}
                        getRowHoverHandlers={getRowHoverHandlers}
                      />
                    )
                  })}
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
        render={(col: DeckCard[]) => (
          <table className={styles.listTable}>
            <tbody>
              {col.map(card => {
                const cardProps = createCardProps(
                  card,
                  deckState,
                  editMode,
                  isPending,
                  showLegality,
                  handlers,
                  issuesById.get(card.id) || []
                )
                return (
                  <DeckRow
                    key={card.deckCardId || card.id}
                    variant="list"
                    {...cardProps}
                    getRowHoverHandlers={getRowHoverHandlers}
                  />
                )
              })}
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
  isCardProblematic,
}: ViewProps) {
  const { issuesById } = useLegalityIndex(legality as any)

  const listByName = useMemo(() => buildNameList(cards), [cards])
  const mvData = useMemo(
    () => convertToDeckSections(buildMvSections(cards)),
    [cards]
  )
  const typeData = useMemo(
    () => convertToDeckSections(buildTypeSections(cards)),
    [cards]
  )
  const colorData = useMemo(
    () => convertToDeckSections(buildColorSections(cards)),
    [cards]
  )

  const handlers: DeckCardHandlers = {
    updateDeckCardQty,
    removeCardFromDeck,
    setShowcased,
    isCardProblematic: isCardProblematic || (() => false),
  }

  const renderSections = (
    sections: DeckSection[],
    lands: DeckCard[],
    titleForLands = 'Terrains'
  ) => {
    const ordered = createSectionWithLands(sections, lands, titleForLands)

    return (
      <Masonry className={styles.listMasonry} cols={compactCols} style={{}}>
        {ordered.map(sec => {
          const count = calculateSectionTotal(sec.items)
          const meta = getSectionMeta(sec.key, sec.title, TYPE_META, COLOR_META)

          return (
            <SectionBlock
              key={sec.key}
              title={meta.label}
              count={count}
              icon={null}
            >
              <table className={styles.sectionTable}>
                <tbody>
                  {sec.items.map(card => {
                    const cardProps = createCardProps(
                      card,
                      deckState,
                      editMode,
                      isPending,
                      showLegality,
                      handlers,
                      issuesById.get(card.id) || []
                    )
                    return (
                      <DeckRow
                        key={card.deckCardId || card.id}
                        variant="compact"
                        {...cardProps}
                        getRowHoverHandlers={getRowHoverHandlers}
                      />
                    )
                  })}
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
        render={(col: DeckCard[]) => (
          <table className={styles.listTable}>
            <tbody>
              {col.map(card => {
                const cardProps = createCardProps(
                  card,
                  deckState,
                  editMode,
                  isPending,
                  showLegality,
                  handlers,
                  issuesById.get(card.id) || []
                )
                return (
                  <DeckRow
                    key={card.deckCardId || card.id}
                    variant="compact"
                    {...cardProps}
                    getRowHoverHandlers={getRowHoverHandlers}
                  />
                )
              })}
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
  isCardProblematic,
}: ViewProps) {
  // Config d'affichage pour DeckPile
  const CARD_W = 140
  const CARD_H = 200
  const OFFSET_Y = 20
  const VISIBLE_CAP = Number.POSITIVE_INFINITY
  const pileCfg = { CARD_W, CARD_H, OFFSET_Y, CAP: VISIBLE_CAP }

  const { issuesById } = useLegalityIndex(legality as any)

  const listByName = useMemo(() => buildNameList(cards), [cards])
  const mvData = useMemo(
    () => convertToDeckSections(buildMvSections(cards)),
    [cards]
  )
  const typeData = useMemo(
    () => convertToDeckSections(buildTypeSections(cards)),
    [cards]
  )
  const colorData = useMemo(
    () => convertToDeckSections(buildColorSections(cards)),
    [cards]
  )

  const handlers: DeckCardHandlers = {
    updateDeckCardQty,
    removeCardFromDeck,
    setShowcased,
    isCardProblematic: isCardProblematic || (() => false),
  }

  const renderPile = (card: DeckCard) => {
    const cardProps = createCardProps(
      card,
      deckState,
      editMode,
      isPending,
      showLegality,
      handlers,
      issuesById.get(card.id) || []
    )
    return (
      <DeckPile
        key={card.deckCardId || card.id}
        {...cardProps}
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
        {typeData.sections.map(sec =>
          renderSection(
            sec,
            cards => (
              <ul className={styles.pilesRow}>{cards.map(renderPile)}</ul>
            ),
            TYPE_META,
            COLOR_META
          )
        )}
      </Masonry>
    )
  }

  if (sortKey === 'color') {
    const sectionsWithLands = createSectionWithLands(
      colorData.sections,
      colorData.lands,
      'Terrains'
    )

    return (
      <Masonry className={styles.listMasonry} cols={stackCols} style={{}}>
        {sectionsWithLands.map(sec =>
          renderSection(
            sec,
            cards => (
              <ul className={styles.pilesRow}>{cards.map(renderPile)}</ul>
            ),
            TYPE_META,
            COLOR_META
          )
        )}
      </Masonry>
    )
  }

  // mv (par défaut)
  const colsCount = mvData.sections.length || 1
  return (
    <div
      className={styles.pilesByMV}
      style={{
        ['--cols' as any]: colsCount,
        ['--card-w' as any]: `${CARD_W}px`,
        ['--card-h' as any]: `${CARD_H}px`,
      }}
    >
      {mvData.sections.map(sec => (
        <div key={sec.key} className={styles.mvColumn}>
          <ul className={styles.pilesList}>{sec.items.map(renderPile)}</ul>
        </div>
      ))}

      {mvData.lands.length > 0 && (
        <div className={styles.landsSection}>
          <div className={styles.landsHeader}>Terrains</div>
          <ul className={styles.landsRow}>{mvData.lands.map(renderPile)}</ul>
        </div>
      )}
    </div>
  )
}
