import styles from "./DeckCase.module.css";

export default function DeckCase ({ deck, showcasedCard }) {

    return (
        <article className={styles.singleDeck}>
            <div className={styles.scene}>
                <div className={styles.singleDeckBox}>
                    <div className={styles.frontFace}>
                        <div className={styles.frontBox}></div>
                        <div className={styles.frontOpening}></div>
                    </div>
                    <div className={styles.sideFace}></div>
                    <div className={styles.topFace}></div>
                    <div className={styles.boxShadow}></div>
                </div>
            </div>
        </article>
    )
}