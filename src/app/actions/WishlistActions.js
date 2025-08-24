import 'server-only';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, assertWishlistOwnership } from "@/lib/getAuthenticatedUser";

export async function createWishlistAction(name = "wishlist") {
    "use server";
    const authed = await getAuthenticatedUser({ throwError: true });
    const created = await prisma.wishlistList.create({
      data: {
        name: (name || "wishlist").trim(),
        userId: authed.id,
      },
      select: { id: true, name: true },
    });
    return { list: { ...created, items: [] } };
}

export async function addManyToWishlistAction(listId, items /* [{scryfallId, quantity}] */) {
"use server";
await assertWishlistOwnership(listId);

if (!Array.isArray(items) || items.length === 0) {
    return { items: [] };
}

// Upsert en masse (filtre et normalise)
const ops = items
    .map(it => ({
    scryfallId: String(it?.scryfallId || ""),
    quantity: Number(it?.quantity || 0),
    }))
    .filter(it => it.scryfallId && it.quantity > 0)
    .map(it =>
    prisma.wishlistItem.upsert({
        // ✅ bon nom de clé composite (cf. message d'erreur: wishlistId_scryfallId)
        where: { wishlistId_scryfallId: { wishlistId: listId, scryfallId: it.scryfallId } },
        update: { quantity: { increment: it.quantity } },
        // ✅ bon champ FK: wishlistId
        create: { wishlistId: listId, scryfallId: it.scryfallId, quantity: it.quantity },
        select: { id: true, scryfallId: true, quantity: true },
    })
    );

    const results = await prisma.$transaction(ops);

return JSON.parse(JSON.stringify({ items: results }));
}
