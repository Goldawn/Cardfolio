import Link from 'next/link';
import styles from '../page.module.css';

export default function NavBar() {
  return (
    <nav>
      <ul id={styles.mainUl}>
        <li className={styles.mainMenu}><Link href="/mtg/collection">MTG</Link></li>
        <li className={styles.mainMenu}><Link href="/lorcana">Lorcana</Link></li>
        <li className={styles.mainMenu}><Link href="/pokemon">Pokémon</Link></li>
      </ul>
    </nav>
  );
}