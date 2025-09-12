import React from 'react'
import styles from './DeckCase.module.css'

interface DeckCaseProps {
  deck: any
  showcasedCard?: any
}

export default function DeckCase({
  deck,
  showcasedCard: _showcasedCard,
}: DeckCaseProps) {
  const defaultCover = '/assets/images/card_art/abro-34-titania-s-command.jpg'
  const showcasedArt = deck.showcasedArt || defaultCover
  const coverStyle = {
    '--cover': `url("${showcasedArt}")`,
  } as React.CSSProperties

  return (
    <article className={styles.singleDeck}>
      <div className={styles.scene}>
        <div className={styles.singleDeckBox} style={coverStyle}>
          <div className={styles.frontFace}>
            <div className={styles.frontBox}></div>
            <div className={styles.frontOpening}></div>
          </div>
          <div className={styles.sideFace}></div>
          <div className={styles.topFace}></div>
          <div className={styles.boxShadow}></div>
        </div>
      </div>
    </article>
  )
}
