import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  console.log("🧪 Params reçus :", params);
  const { userId, wishlistId } = params;

  if (!userId || !wishlistId) {
    return NextResponse.json(
      { error: "Paramètres requis manquants (userId, wishlistId)" },
      { status: 400 }
    );
  }

  try {
    const list = await prisma.wishlistList.findUnique({
      where: { id: wishlistId },
    });

    if (!list || list.userId !== userId) {
      return NextResponse.json(
        { error: "Liste non trouvée ou non autorisée" },
        { status: 403 }
      );
    }

    const items = await prisma.wishlistItem.findMany({
      where: {
        wishlistId,
      },
      orderBy: {
        dateAdded: "desc",
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("❌ Erreur GET items par wishlist:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement des cartes" },
      { status: 500 }
    );
  }
}