import 'server-only';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser, assertDeckOwnership } from "@/lib/getAuthenticatedUser";

async function getDeckIdFromDeckCard(deckCardId) {
"use server";
const dc = await prisma.deckCard.findUnique({
    where: { id: deckCardId },
    select: { deckId: true },
});
return dc?.deckId ?? null;
}

export async function addCardToDeckAction(deckId, scryfallId, qty = 1) {
    "use server";
    await assertDeckOwnership(deckId);

    if (!scryfallId || typeof qty !== "number" || qty <= 0) {
        throw new Error("Paramètres invalides pour l'ajout de carte.");
    }

    const existing = await prisma.deckCard.findFirst({
        where: { deckId, scryfallId },
        select: { id: true, quantity: true },
    });

    let saved;
    if (existing) {
        saved = await prisma.deckCard.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + qty },
        select: { id: true, scryfallId: true, quantity: true, deckId: true },
        });
    } else {
        saved = await prisma.deckCard.create({
        data: { deckId, scryfallId, quantity: qty },
        select: { id: true, scryfallId: true, quantity: true, deckId: true },
        });
    }

    return JSON.parse(JSON.stringify({ kind: existing ? "updated" : "created", item: saved }));
}

export async function updateDeckCardQtyAction(deckCardId, nextQty) {
    "use server";
    if (!deckCardId || typeof nextQty !== "number") {
        throw new Error("Paramètres invalides.");
    }
    const targetDeckId = await getDeckIdFromDeckCard(deckCardId);
    if (!targetDeckId) throw new Error("Carte introuvable.");
    await assertDeckOwnership(targetDeckId);

    if (nextQty <= 0) {
        const deleted = await prisma.deckCard.delete({
        where: { id: deckCardId },
        select: { id: true, scryfallId: true, deckId: true },
        });
        return JSON.parse(JSON.stringify({ kind: "deleted", item: deleted }));
    }

    const updated = await prisma.deckCard.update({
        where: { id: deckCardId },
        data: { quantity: nextQty },
        select: { id: true, scryfallId: true, quantity: true, deckId: true },
    });
    return JSON.parse(JSON.stringify({ kind: "updated", item: updated }));
}

export async function removeCardFromDeckAction(deckCardId) {
    "use server";
    if (!deckCardId) throw new Error("deckCardId requis.");

    const targetDeckId = await getDeckIdFromDeckCard(deckCardId);
    if (!targetDeckId) throw new Error("Carte introuvable.");
    await assertDeckOwnership(targetDeckId);

    const deleted = await prisma.deckCard.delete({
        where: { id: deckCardId },
        select: { id: true, scryfallId: true, deckId: true },
    });
    return JSON.parse(JSON.stringify({ kind: "deleted", item: deleted }));
}

export async function bulkUpsertDeckCardsAction(deckId, entries /* [{scryfallId, qty}] */) {
    "use server";
    await assertDeckOwnership(deckId);

    if (!Array.isArray(entries) || entries.length === 0) {
        return { kind: "noop" };
    }

    const result = await prisma.$transaction(async (tx) => {
        const out = [];
        for (const entry of entries) {
        const scryfallId = entry?.scryfallId;
        const qty = Number(entry?.qty ?? 0);
        if (!scryfallId || qty <= 0) continue;

        const existing = await tx.deckCard.findFirst({
            where: { deckId, scryfallId },
            select: { id: true, quantity: true },
        });

        let saved;
        if (existing) {
            saved = await tx.deckCard.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + qty },
            select: { id: true, scryfallId: true, quantity: true, deckId: true },
            });
            out.push({ kind: "updated", item: saved });
        } else {
            saved = await tx.deckCard.create({
            data: { deckId, scryfallId, quantity: qty },
            select: { id: true, scryfallId: true, quantity: true, deckId: true },
            });
            out.push({ kind: "created", item: saved });
        }
        }
        return out;
    });

    return JSON.parse(JSON.stringify({ kind: "bulk", items: result }));
}

export async function renameDeckAction(deckId, newName) {
    "use server";
    if (!newName || !newName.trim()) throw new Error("Nom invalide.");
    await assertDeckOwnership(deckId);

    const updated = await prisma.decklist.update({
        where: { id: deckId },
        data: { name: newName.trim() },
        select: { id: true, name: true },
    });
    return JSON.parse(JSON.stringify(updated));
}

export async function setDeckFormatAction(deckId, format) {
    "use server";
    await assertDeckOwnership(deckId);

    const updated = await prisma.decklist.update({
        where: { id: deckId },
        data: { format },
        select: { id: true, format: true },
    });
    return JSON.parse(JSON.stringify(updated));
}

export async function toggleDeckLockAction(deckId, force) {
    "use server";
    await assertDeckOwnership(deckId);
    const deck = await prisma.decklist.findUnique({ where: { id: deckId }, select: { isLocked: true } });
    const next = typeof force === "boolean" ? force : !deck?.isLocked;
    const updated = await prisma.decklist.update({
        where: { id: deckId },
        data: { isLocked: next },
        select: { id: true, isLocked: true },
    });
    return JSON.parse(JSON.stringify(updated));
}

export async function updateDeckNotesAction(deckId, notes) {
    "use server";
    await assertDeckOwnership(deckId);
    const updated = await prisma.decklist.update({
        where: { id: deckId },
        data: { notes },
        select: { id: true, notes: true },
    });
    return JSON.parse(JSON.stringify(updated));
}

export async function duplicateDeckAction(deckId) {
    "use server";
    await assertDeckOwnership(deckId);

    // charge deck + ses cartes
    const deck = await prisma.decklist.findUnique({
    where: { id: deckId },
    include: { cards: true },
    });
    if (!deck) throw new Error("Deck introuvable");

    const copy = await prisma.decklist.create({
    data: {
        name: deck.name + " (copie)",
        userId: deck.userId,
        format: deck.format,
        colors: deck.colors,
        notes: deck.notes ?? null,
        showcasedDeckCardId: null,
        showcasedArt: null,
        cards: {
        create: deck.cards.map((c) => ({
            scryfallId: (c).scryfallId,
            quantity: (c).quantity,
        })),
        },
    },
    select: { id: true, name: true },
    });

    return JSON.parse(JSON.stringify(copy));
}

export async function setShowcasedCardAction(deckId, payload) {
    "use server";
    await assertDeckOwnership(deckId);

    const nextId = payload?.deckCardId ?? null;
    const nextArt = payload?.artUrl ?? null;

    const current  = await prisma.decklist.findUnique({
        where: { id: deckId },
        select: { showcasedDeckCardId: true },
    });

    // Si on reclique la même carte → on l’enlève
    const shouldUnset =
    current?.showcasedDeckCardId && current.showcasedDeckCardId === nextId;

        const updated = await prisma.decklist.update({
        where: { id: deckId },
        data: shouldUnset
        ? { showcasedDeckCardId: null, showcasedArt: null }
        : { showcasedDeckCardId: nextId, showcasedArt: nextArt },
        select: { id: true, showcasedDeckCardId: true, showcasedArt: true },
    });
    return JSON.parse(JSON.stringify(updated));
}

export async function deleteDeckAction(deckId) {
    "use server";
    await assertDeckOwnership(deckId);

    // si tu n'as pas de cascade côté Prisma, supprime d'abord les deckCards :
    await prisma.deckCard.deleteMany({ where: { deckId } });

    await prisma.decklist.delete({ where: { id: deckId } });
    return { ok: true };
}