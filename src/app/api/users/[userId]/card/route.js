import { prisma } from "@/lib/prisma";

// SETUP de la route pour récupérer 
export async function POST(req, { params }) {
  const { userId } = params;
  const { scryfallIds } = await req.json();

  console.log("userID :", userId);
  console.log("scryfallIds :", scryfallIds);

  // if (!scryfallIds.length) {
  //   return Response.json({ error: "No scryfallIds provided" }, { status: 400 });
  // }

  const [collection, wishlists] = await Promise.all([
  // const [collection, wishlists, decklists] = await Promise.all([
    prisma.collectionItem.findMany({
      where: { userId, scryfallId: { in: scryfallIds } },
      select: { scryfallId: true, quantity: true }
    }),
    prisma.wishlistList.findMany({
      where: { userId },
      include: {
        items: {
          where: { scryfallId: { in: scryfallIds } },
          select: { scryfallId: true, quantity: true }
        }
      }
    }),
    // prisma.decklist.findMany({
    //   where: { userId },
    //   include: {
    //     cards: {
    //       where: { scryfallId: { in: scryfallIds } },
    //       select: { scryfallId: true, quantity: true }
    //     }
    //   }
    // })
  ]);

  const usage = {};

  scryfallIds.forEach(id => {
    usage[id] = { collection: 0, wishlists: [], decklists: [] };
  });

  // Collection
  collection.forEach(item => {
    usage[item.scryfallId].collection = item.quantity;
  });

  // Wishlists
  wishlists.forEach(list => {
    list.items.forEach(item => {
      usage[item.scryfallId].wishlists.push({
        listId: list.id,
        name: list.name,
        quantity: item.quantity
      });
    });
  });

  // Decklists
  // decklists.forEach(deck => {
  //   deck.cards.forEach(card => {
  //     usage[card.scryfallId].decklists.push({
  //       deckId: deck.id,
  //       name: deck.name,
  //       quantity: card.quantity
  //     });
  //   });
  // });

  return Response.json(usage);
}