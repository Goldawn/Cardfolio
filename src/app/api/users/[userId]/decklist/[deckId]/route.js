import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";


// GET - Récupération de toutes les cartes d'un deck spécifique
export async function GET(request, { params }) {
  console.log("ENTREE DANS LE ROUTE DE DECK ID")
  const { userId, deckId } = await params;
  console.log("userId:", userId, "deckId:", deckId);

  if (!userId || !deckId) {
    return NextResponse.json(
      { error: "Paramètres requis manquants (userId, deckId)" },
      { status: 400 }
    );
  }

  try {
    const list = await prisma.Decklist.findUnique({
      where: { id: deckId },
    });

    if (!list || list.userId !== userId) {
      return NextResponse.json(
        { error: "deck non trouvé ou non autorisé" },
        { status: 403 }
      );
    }

    const items = await prisma.DeckCard.findMany({
      where: {
        deckId,
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("❌ Erreur GET items par deck:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement des cartes" },
      { status: 500 }
    );
  }
}