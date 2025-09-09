import styles from './Loader.module.css'
import type { JSX } from 'react'

export default function Loader(): JSX.Element {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.spinner}></div>
      <p>Chargement des cartes...</p>
    </div>
  )
}
