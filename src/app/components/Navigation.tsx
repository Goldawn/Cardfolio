'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Navigation.module.css'
import type { JSX } from 'react'


export default function Navigation(): JSX.Element {
  const pathname = usePathname()
  const isActive = (href: string): string => (pathname === href ? styles.active : '')

  return (
    <nav>
      <ul id={styles.globalNavigation}>
        <li className={styles.navigationElement}>
          <Link href="/" className={isActive('/') ? 'active' : ''}>
            Home
          </Link>
        </li>
        <li className={styles.navigationElement}>
          <Link
            href="/mtg/collection"
            className={isActive('/mtg') ? 'active' : ''}
          >
            MTG
          </Link>
        </li>
        <li className={styles.navigationElement}>
          <Link
            href="/lorcana"
            className={isActive('/lorcana') ? 'active' : ''}
          >
            Lorcana
          </Link>
        </li>
        <li className={styles.navigationElement}>
          <Link
            href="/pokemon"
            className={isActive('/pokemon') ? 'active' : ''}
          >
            Pokémon
          </Link>
        </li>
        <li className={styles.navigationElement}>
          <Link href="" className={isActive('') ? 'active' : ''}>
            +
          </Link>
        </li>
      </ul>
    </nav>
  )
}
