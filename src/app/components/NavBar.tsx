import Link from 'next/link'
import logo from '../assets/images/icons/magic_logo_full.png'
import pkmnLogo from '../assets/images/icons/pokemon-logo-png-1444.png'
import lorcanaLogo from '../assets/images/icons/Big-Logo-Lorcana.png'
import riftboundLogo from '../assets/images/icons/riftbound_logo.png'
import Image from 'next/image'
import styles from '../page.module.css'
import type { JSX } from 'react'


export default function NavBar(): JSX.Element {
  return (
    <nav>
      <ul id={styles.mainUl}>
        <li className={`${styles.mainMenu} ${styles.magicBg}`}>
          <Link href="/mtg/collection">
            <div className={styles.linkdiv}>
              <Image src={logo} width={180} height={60} alt={'Logo Magic'} />
            </div>
          </Link>
        </li>

        <li className={`${styles.mainMenu} ${styles.lorcanaBg}`}>
          <Link href="/lorcana">
            <div className={styles.linkdiv}>
              <Image
                src={lorcanaLogo}
                width={180}
                height={85}
                alt={'Logo Lorcana'}
              />
            </div>
          </Link>
        </li>

        <li className={`${styles.mainMenu} ${styles.pkmnBg}`}>
          <Link href="/pokemon">
            <div className={styles.linkdiv}>
              <Image
                src={pkmnLogo}
                width={180}
                height={140}
                alt={'Logo Pokemon'}
              />
            </div>
          </Link>
        </li>

        <li className={`${styles.mainMenu} ${styles.riftboundBg}`}>
          <Link href="/riftbound">
            <div className={styles.linkdiv}>
              <Image
                src={riftboundLogo}
                width={180}
                height={80}
                alt={'Logo Riftbound'}
              />
            </div>
          </Link>
        </li>
      </ul>
    </nav>
  )
}
