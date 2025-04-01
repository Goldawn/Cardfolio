import { prisma } from "@/lib/prisma";

// GET - Récupérer toutes les listes de wishlist d'un utilisateur
export async function GET(request, { params }) {
  const { userId } = params;

  try {
    const lists = await prisma.wishlistList.findMany({
      where: { userId },
      include: {
        items: {
          select: {
            quantity: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const listsWithTotalQuantity = lists.map((list) => {
      const totalQuantity = list.items.reduce((sum, item) => sum + item.quantity, 0);
      return {
        ...list,
        totalQuantity,
      };
    });

    return Response.json(listsWithTotalQuantity);
  } catch (error) {
    console.error("❌ Erreur GET wishlist/lists:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
}

// POST - Créer une nouvelle liste de wishlist
export async function POST(request, { params }) {
  const { userId } = params;
  const { name } = await request.json();

  if (!name) {
    return new Response(JSON.stringify({ error: "Nom de liste requis" }), { status: 400 });
  }

  try {
    const newList = await prisma.wishlistList.create({
      data: {
        name,
        user: { connect: { id: userId } },
      },
    });

    return Response.json(newList);
  } catch (error) {
    console.error("Erreur POST wishlist list:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
}

// PATCH - Renommer ou dupliquer une liste de souhaits
export async function PATCH(request, { params }) {
  const { userId } = params;
  const { listId, name, duplicate } = await request.json(); // 👈 name au lieu de newName

  if (!listId || !name) {
    return new Response(JSON.stringify({ error: "Données manquantes" }), { status: 400 });
  }

  try {
    if (duplicate) {
      const original = await prisma.wishlistList.findUnique({
        where: { id: listId },
        include: { items: true },
      });

      if (!original) {
        return new Response(JSON.stringify({ error: "Liste introuvable" }), { status: 404 });
      }

      const duplicated = await prisma.wishlistList.create({
        data: {
          name, // 👈 ici aussi
          user: { connect: { id: userId } },
          items: {
            create: original.items.map(item => ({
              scryfallId: item.scryfallId,
              quantity: item.quantity,
            })),
          },
        },
      });

      return Response.json({ id: duplicated.id, name: duplicated.name });
    } else {
      const renamed = await prisma.wishlistList.update({
        where: { id: listId },
        data: { name }, // 👈 ici aussi
      });

      return Response.json({ id: renamed.id, name: renamed.name });
    }
  } catch (error) {
    console.error("Erreur PATCH wishlist list:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
}


// DELETE - Supprimer une liste de wishlist (et ses cartes associées)
export async function DELETE(request, { params }) {
  const { userId } = params;
  const { listId } = await request.json();

  if (!listId) {
    return new Response(JSON.stringify({ error: "ID de liste manquant" }), { status: 400 });
  }

  try {
    await prisma.wishlistList.delete({
      where: {
        id: listId,
        userId,
      },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Erreur DELETE wishlist list:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
}