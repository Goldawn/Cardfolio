import styles from "./DeckCase.module.css";

export default function DeckCase ({ deck, showcasedCard }) {

    const defaultCover = "/assets/images/card_art/abro-34-titania-s-command.jpg";
    const showcasedArt = deck.showcasedArt || defaultCover;
    const coverStyle = { '--cover': `url("${showcasedArt}")` };


    return (
        <article className={styles.singleDeck}>
            <div className={styles.scene}>
                <div className={styles.singleDeckBox} style={coverStyle}>
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