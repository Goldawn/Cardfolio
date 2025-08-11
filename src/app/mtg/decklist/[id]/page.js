import Card from "../../../components/Card";
import { prisma } from "@/lib/prisma";
import { formatCard } from "../../../services/FormatCard";
import { auth } from "@/lib/auth"
import styles from "./page.module.css";

export default async function SingleDeck ({ params }) {

  const { user } = await auth();
  const userId = user.id;
  // const { user: { id: userId } } = await auth();
  // const userId = (await auth())?.user?.id;

  const { id } = await params

  
  // const allDecks = await prisma.Decklist.findUnique({where: { id: id },});
  const decklist = await prisma.DeckCard.findMany({where: {deckId: id,},});

  const enriched = await Promise.all(
    decklist.map(async (card) => {
      const res = await fetch(`https://api.scryfall.com/cards/${card.scryfallId}`);
      const raw = await res.json();
      const formatted = formatCard(raw);
      return {
        ...formatted,
        decklistQuantity: card.quantity,
        wishlistItemId: card.id,
      };
    })
  );


  // console.log("list:", allDecks);
  // console.log("Decklist:", decklist);
  // console.log("Enriched Decklist:", enriched);

    return (
        <div id={styles.deckPage}>
          <section id={styles.decklistOverview}>
              <ul>
              {enriched.map((card, index) => (
                <li>
                  <Card
                    key={card.id}
                    // listId={id}
                    card={card}
                    // currentIndex={index}
                    showDecklistQuantity
                    name={true}
                  />
                </li>


                  // <Card
                  // listId={list.id}
                //   cardList={cardsByList[list.id]}
                //   modal={true}
                //   showWishlistQuantity
                //   showDeleteButton
                //   onRemove={(cardId) => removeCard(list.id, cardId)}
                //   editableQuantity
                //   updateQuantity={(cardId, delta) => updateQuantity(list.id, cardId, delta)}
                // />
              ))}
            </ul>
          </section>
        </div>
    )
}