import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ImportClient from "./ImportClient";

export default async function MTGImportPage() {
  const { user } = await auth();
  if (!user) return <p>Veuillez vous connecter pour accéder à cette page.</p>;

  const userId = user.id;



  // Load collection & wishlist on the server for this user

  // const [collectionFromDb, wishlistListsFromDb] = await Promise.all([
  //   prisma.collection.findMany({ where: { userId } }),
  //   prisma.wishlistList.findMany({
  //     where: { userId },
  //     include: { items: true },
  //     orderBy: { createdAt: "desc" },
  //   }),
  // ]);

  const userWithCollection = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      collection: true,
    },
  });
  const collectionFromDb = userWithCollection.collection;

  const wishlistListsFromDb = await prisma.wishlistList.findMany({
    where: { userId },
    include: {
        items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("wishlistListsFromDb", wishlistListsFromDb[0]?.items[0]);


  // Make them serializable for Client Components
  const initialCollection = JSON.parse(JSON.stringify(collectionFromDb));
  const initialWishlistLists = JSON.parse(JSON.stringify(wishlistListsFromDb));

  console.log("initialWishlistLists", initialWishlistLists);





  // Actions for the client component
  async function addToCollectionAction(scryfallId, newPriceEntry) {
    "use server";

    // vérifie si la carte existe déjà pour cet utilisateur
    const existing = await prisma.collection.findFirst({
      where: { userId, scryfallId },
      select: { id: true, quantity: true, priceHistory: true },
    });

    if (existing) {
      const updated = await prisma.collection.update({
        where: { id: existing.id },
        data: {
          quantity: { increment: 1 },
          // on pousse l'entrée de prix (facultatif si tu veux éviter les doublons)
          priceHistory: Array.isArray(existing.priceHistory)
            ? [...existing.priceHistory, newPriceEntry]
            : [newPriceEntry],
        },
        select: { id: true, scryfallId: true, quantity: true, priceHistory: true },
      });
      // ⚠️ retourner un plain object
      return JSON.parse(JSON.stringify({ kind: "updated", item: updated }));
    } else {
      const created = await prisma.collection.create({
        data: {
          userId,
          scryfallId,
          quantity: 1,
          priceHistory: [newPriceEntry],
        },
        select: { id: true, scryfallId: true, quantity: true, priceHistory: true },
      });
      return JSON.parse(JSON.stringify({ kind: "created", item: created }));
    }
  }

  async function undoAddToCollectionAction(scryfallId) {
    "use server";

    const existing = await prisma.collection.findFirst({
      where: { userId, scryfallId },
      select: { id: true, quantity: true },
    });
    if (!existing) {
      return JSON.parse(JSON.stringify({ kind: "noop" }));
    }

    if (existing.quantity <= 1) {
      await prisma.collection.delete({ where: { id: existing.id } });
      return JSON.parse(JSON.stringify({ kind: "deleted", scryfallId }));
    } else {
      const updated = await prisma.collection.update({
        where: { id: existing.id },
        data: { quantity: { decrement: 1 } },
        select: { id: true, scryfallId: true, quantity: true },
      });
      return JSON.parse(JSON.stringify({ kind: "updated", item: updated }));
    }
  }

  async function addToWishlistAction(listId, scryfallId, quantity = 1) {
    "use server";

    // sécurise la liste pour ce user
    const list = await prisma.wishlistList.findFirst({
      where: { id: listId, userId },
      select: { id: true },
    });
    if (!list) {
      throw new Error("Liste introuvable ou non autorisée.");
    }

    const existingItem = await prisma.wishlistItem.findFirst({
      where: { wishlistId: listId, scryfallId },
      select: { id: true, quantity: true },
    });

    if (existingItem) {
      const updatedItem = await prisma.wishlistItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: quantity } },
        select: { id: true, wishlistId: true, scryfallId: true, quantity: true },
      });
      return JSON.parse(JSON.stringify({ kind: "updated", item: updatedItem }));
    } else {
      const createdItem = await prisma.wishlistItem.create({
        data: {
          wishlist: { connect: { id: listId } },
          scryfallId,
          quantity,
        },
        select: { id: true, wishlistId: true, scryfallId: true, quantity: true },
      });
      return JSON.parse(JSON.stringify({ kind: "created", item: createdItem }));
    }
  }

  return (
    <ImportClient
      userId={userId}
      initialCollection={initialCollection}
      initialWishlistLists={initialWishlistLists}
       actions={{
        addToCollection: addToCollectionAction,
        undoAddToCollection: undoAddToCollectionAction,
        addToWishlist: addToWishlistAction,
      }}
    />
  );
}