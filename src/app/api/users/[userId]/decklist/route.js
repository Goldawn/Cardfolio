import { prisma } from "@/lib/prisma";

// Récupération de tous les decks d'un utilisateur
export async function GET(request, { params }) {
  const { userId } = await params;
  console.log("ENTRE DE LA ROUTE GET ALL DECKS");
  console.log("userID :", userId);

  try {
    const allItems = await prisma.Decklist.findMany({
      where: { userId },
      select: {
        name: true,
        id: true,
      },
      orderBy: { createdAt: "desc" },
    });
    // console.log("allItems :", allItems);
    return Response.json(allItems);
  } catch (error) {
    console.error("Erreur GET /decklist :", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
    });
  }
}

export async function POST(request, { params }) {
  const { userId } = await params;
  const { name } = await request.json();

  if (!name) {
    return new Response(JSON.stringify({ error: "Nom du deck requis" }), {
      status: 400,
    });
  }

  try {
    const newDeck = await prisma.decklist.create({
        data: {
            name,
            user: { connect: { id: userId } },
        },
    });

    return Response.json(newDeck);

  } catch (error) {
    console.error("Erreur POST decklist :", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
    });
  }
}