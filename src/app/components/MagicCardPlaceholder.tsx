import styles from './MagicCardPlaceholder.module.css'

interface MagicCardPlaceholderProps {
  test: () => void
  image?: string
}

export default function MagicCardPlaceholder({
  test,
  image,
}: MagicCardPlaceholderProps) {
  return (
    <div
      className={`${styles.cardPlaceholder} ${image ? styles.active : ''}`}
      onClick={test}
    >
      {image ? (
        <img className={styles.previewImage} src={image} alt="preview" />
      ) : (
        <>
          <div className={styles.placeHolderImageBox}></div>
          <div className={styles.placeHolderStatsBox}></div>
          <p>Ajouter une carte</p>
        </>
      )}
      {!image && <div className={styles.cardBorder}></div>}
    </div>
  )
}
