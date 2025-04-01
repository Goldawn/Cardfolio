import React from 'react'
import styles from "./MagicCardPlaceholder.module.css"

export default function MagicCardPlaceholder() {
  return (
    <div className={styles.cardPlaceholder}>
        <div className={styles.placeHolderImageBox}></div>
        <div className={styles.placeHolderStatsBox}></div>
        <p>Ajouter une carte</p>
    </div>
  )
}
