import Link from 'next/link';
import styles from './CardMenu.module.css';

export default function CardMenu() {

    return (
        <div className={styles.cardManager}>
            <ul>
                <li><Link href="/mtg">Collection</Link></li>
                <li><Link href="/mtg/decklist">Decklists</Link></li>
                <li><Link href="/mtg/wishlist">Wishlist</Link></li>
                <li><Link href="/mtg/stats">Statistiques</Link></li>
            </ul>
        </div>
    )  
}