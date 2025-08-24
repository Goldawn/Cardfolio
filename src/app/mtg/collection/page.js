import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";
import CollectionClient from "./CollectionClient";

export default async function CollectionPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return <p>Veuillez vous connecter pour accéder à cette page.</p>;
  }

  const userId = user.id;

  // Récupère (ou crée si vide) la collection par défaut du user
  let def = await prisma.collection.findFirst({
    where: { userId },
    include: { items: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  if (!def) {
    def = await prisma.collection.create({
      data: { userId, name: "Main", isDefault: true },
      include: { items: true },
    });
  }

  const initialItems = JSON.parse(JSON.stringify(def.items ?? []));

  // Helper pour retrouver la default à CHAQUE action
  async function getDefaultCollectionId() {
    "use server";
    // ✅ Revalide l'utilisateur côté action pour éviter d'utiliser un userId capturé
    const actionUser = await getAuthenticatedUser({ throwError: true });
    const row = await prisma.collection.findFirst({
      where: { userId: actionUser.id },
      select: { id: true },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return row?.id ?? null;
  }

  // ---------- Server Actions ----------
  async function addToCollectionAction(scryfallId, newPriceEntry) {
    "use server";
    const actionUser = await getAuthenticatedUser({ throwError: true });
    const userId = actionUser.id;

    const collectionId = await getDefaultCollectionId();
    if (!collectionId) return { kind: "noop" };

    const existing = await prisma.collectionItem.findFirst({
      where: { collectionId, scryfallId },
      select: { id: true, quantity: true, priceHistory: true },
    });

    const mergedHistory = Array.isArray(existing?.priceHistory)
      ? [...(existing.priceHistory || []), newPriceEntry]
      : [newPriceEntry];

    let saved;
    if (existing) {
      saved = await prisma.collectionItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: 1 }, priceHistory: mergedHistory },
        select: { id: true, scryfallId: true, quantity: true, priceHistory: true },
      });
    } else {
      saved = await prisma.collectionItem.create({
        data: { collectionId, scryfallId, quantity: 1, priceHistory: mergedHistory },
        select: { id: true, scryfallId: true, quantity: true, priceHistory: true },
      });
    }

    await prisma.collectionChangeLog.create({
      data: {
        userId,
        scryfallId,
        changeType: existing ? "add" : "create",
        quantity: +1,
        totalAfter: saved.quantity,
      },
    });

    return JSON.parse(JSON.stringify({ kind: existing ? "updated" : "created", item: saved }));
  }

  async function updateCollectionQuantityAction(scryfallId, delta) {
    "use server";
    const actionUser = await getAuthenticatedUser({ throwError: true });
    const userId = actionUser.id;

    if (!delta || typeof delta !== "number") return { kind: "noop" };

    const collectionId = await getDefaultCollectionId();
    if (!collectionId) return { kind: "noop" };

    const existing = await prisma.collectionItem.findFirst({
      where: { collectionId, scryfallId },
      select: { id: true, quantity: true },
    });

    if (!existing) {
      if (delta > 0) {
        const created = await prisma.collectionItem.create({
          data: { collectionId, scryfallId, quantity: delta },
          select: { id: true, scryfallId: true, quantity: true },
        });
        await prisma.collectionChangeLog.create({
          data: { userId, scryfallId, changeType: "add", quantity: delta, totalAfter: created.quantity },
        });
        return JSON.parse(JSON.stringify({ kind: "updated", item: created }));
      }
      return { kind: "noop" };
    }

    const nextQty = existing.quantity + delta;
    if (nextQty <= 0) {
      await prisma.collectionItem.delete({ where: { id: existing.id } });
      await prisma.collectionChangeLog.create({
        data: { userId, scryfallId, changeType: "remove_all", quantity: -existing.quantity, totalAfter: 0 },
      });
      return JSON.parse(JSON.stringify({ kind: "deleted", scryfallId }));
    }

    const updated = await prisma.collectionItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
      select: { id: true, scryfallId: true, quantity: true },
    });

    await prisma.collectionChangeLog.create({
      data: {
        userId,
        scryfallId,
        changeType: delta > 0 ? "add" : "remove",
        quantity: delta,
        totalAfter: updated.quantity,
      },
    });

    return JSON.parse(JSON.stringify({ kind: "updated", item: updated }));
  }

  async function removeFromCollectionAction(scryfallId) {
    "use server";
    const actionUser = await getAuthenticatedUser({ throwError: true });
    const userId = actionUser.id;

    const collectionId = await getDefaultCollectionId();
    if (!collectionId) return { kind: "noop" };

    const existing = await prisma.collectionItem.findFirst({
      where: { collectionId, scryfallId },
      select: { id: true, quantity: true },
    });
    if (!existing) return { kind: "noop" };

    await prisma.collectionItem.delete({ where: { id: existing.id } });

    await prisma.collectionChangeLog.create({
      data: {
        userId,
        scryfallId,
        changeType: "remove_all",
        quantity: -existing.quantity,
        totalAfter: 0,
      },
    });

    return JSON.parse(JSON.stringify({ kind: "deleted", scryfallId }));
  }

  return (
    <CollectionClient
      initialItems={initialItems}
      actions={{
        addToCollection: addToCollectionAction,
        updateCollectionQuantity: updateCollectionQuantityAction,
        removeFromCollection: removeFromCollectionAction,
      }}
    />
  );
}