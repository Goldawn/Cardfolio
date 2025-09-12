import Link from 'next/link'
import styles from './CardMenu.module.css'
import type { JSX } from 'react'

export default function CardMenu(): JSX.Element {
  return (
    <div className={styles.cardManager}>
      <ul>
        <li>
          <Link href="/mtg/collection">Collection</Link>
        </li>
        <li>
          <Link href="/mtg/decklist">Decklists</Link>
        </li>
        <li>
          <Link href="/mtg/wishlist">Wishlist</Link>
        </li>
        <li>
          <Link href="/mtg/stats">Statistiques</Link>
        </li>
      </ul>
    </div>
  )
}
