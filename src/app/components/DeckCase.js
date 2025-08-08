import styles from "./DeckCase.module.css";
import Link from "next/link";

export default function DeckCase ({ deck }) {



    return (
        <>
        <div className={styles.deckCase}></div>
        <Link href={`/mtg/decklist/${deck.id}`}><h3>{deck.name}</h3></Link>
        </>
    )
}