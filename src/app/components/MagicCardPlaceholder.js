import React from 'react'
import styles from "./MagicCardPlaceholder.module.css"

export default function MagicCardPlaceholder({ test, image }) {
  return (
    <div className={`${styles.cardPlaceholder} ${ image ? styles.active : ""}`} onClick={test}>
      {image ? (
        <img className={styles.previewImage} src={image} alt="preview" />
      ) : (
        <>
          <div className={styles.placeHolderImageBox}></div>
          <div className={styles.placeHolderStatsBox}></div>
          <p>Ajouter une carte</p>
        </>
      )}
      {!image &&
        <div className={styles.cardBorder}></div>
      }
    </div>
  );
}