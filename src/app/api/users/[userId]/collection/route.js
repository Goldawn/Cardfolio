import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const { userId } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        collection: true,
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return Response.json(user.collection);
  } catch (error) {
    console.error("Erreur API collection :", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

export async function POST(request, { params }) {
  const { userId } = params;
  const body = await request.json();

  const { scryfallId, quantity, priceHistory } = body;

  if (!scryfallId || !quantity) {
    return new Response(JSON.stringify({ error: "Données manquantes" }), {
      status: 400,
    });
  }

  try {
    const newCard = await prisma.collectionItem.create({
      data: {
        scryfallId,
        quantity,
        priceHistory: priceHistory || [],
        user: {
          connect: { id: userId },
        },
      },
    });

    // 🆕 Création du log
    await prisma.collectionChangeLog.create({
      data: {
        userId,
        scryfallId,
        changeType: "add",
        quantity,
        totalAfter: quantity,
      },
    });

    return Response.json(newCard);
  } catch (error) {
    console.error("Erreur ajout collection :", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
    });
  }
}

export async function PATCH(request, { params }) {
  const { userId } = params;
  const { scryfallId, quantityDelta, newPriceEntry } = await request.json();

  if (!scryfallId || typeof quantityDelta !== "number") {
    return new Response(JSON.stringify({ error: "Données manquantes ou invalides" }), {
      status: 400,
    });
  }

  try {
    const existing = await prisma.collectionItem.findFirst({
      where: {
        userId,
        scryfallId,
      },
    });

    if (!existing) {
      return new Response(JSON.stringify({ error: "Carte non trouvée" }), {
        status: 404,
      });
    }

    const newQuantity = existing.quantity + quantityDelta;

    // 👇 Si on supprime la carte (quantité <= 0)
    if (newQuantity < 1) {
      await prisma.collectionItem.delete({
        where: { id: existing.id },
      });

      await prisma.collectionChangeLog.create({
        data: {
          userId,
          scryfallId,
          changeType: "remove",
          quantity: quantityDelta,
          totalAfter: 0,
        },
      });

      return new Response(null, { status: 204 });
    }

    // 👇 Sinon, on met à jour la carte normalement
    const updated = await prisma.collectionItem.update({
      where: { id: existing.id },
      data: {
        quantity: newQuantity,
        priceHistory: {
          push: newPriceEntry ? [newPriceEntry] : [],
        },
      },
    });

    // 👇 Ajout dans le log
    await prisma.collectionChangeLog.create({
      data: {
        userId,
        scryfallId,
        changeType: quantityDelta > 0 ? "add" : "remove",
        quantity: quantityDelta,
        totalAfter: newQuantity,
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Erreur PATCH collection :", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
    });
  }
}

export async function DELETE(request, { params }) {
    const { userId } = params;
    const { scryfallId } = await request.json();
  
    if (!scryfallId) {
      return new Response(JSON.stringify({ error: "scryfallId manquant" }), { status: 400 });
    }
  
    try {
      const existing = await prisma.collectionItem.findFirst({
        where: {
          userId,
          scryfallId,
        },
      });
  
      if (!existing) {
        return new Response(JSON.stringify({ error: "Carte non trouvée" }), { status: 404 });
      }
  
      await prisma.collectionItem.delete({
        where: { id: existing.id },
      });
  
      return new Response(null, { status: 204 });
    } catch (error) {
      console.error("Erreur DELETE collection :", error);
      return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
    }
}