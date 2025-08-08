import { prisma } from "@/lib/prisma";

// GET – Liste tous les items de wishlist de l'utilisateur (avec la liste associée)
export async function GET(request, { params }) {
  const { userId } =await params;

  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId },
      include: {
        list: true,
      },
      orderBy: {
        dateAdded: "desc",
      },
    });

    return Response.json(items);
  } catch (error) {
    console.error("Erreur GET wishlist items:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
}

// // POST – Ajoute une carte à une liste de souhaits
// export async function POST(request, { params }) {
//   const { userId } = await params;
//   const { scryfallId, quantity = 1, wishlistId } = await request.json();

//   if (!userId || !scryfallId || !wishlistId) {
//     return new Response(
//       JSON.stringify({ error: "Champs requis manquants (userId, scryfallId, wishlistId)" }),
//       { status: 400 }
//     );
//   }

//   try {
//     const list = await prisma.wishlistList.findUnique({
//       where: { id: wishlistId },
//     });

//     if (!list || list.userId !== userId) {
//       return new Response(JSON.stringify({ error: "Liste non trouvée ou non autorisée" }), {
//         status: 403,
//       });
//     }

//     // 🔍 Vérifie si la carte est déjà dans la liste
//     const existingItem = await prisma.wishlistItem.findFirst({
//       where: {
//         wishlistId,
//         scryfallId,
//       },
//     });

//     if (existingItem) {
//       // 🆙 Met à jour la quantité
//       const updatedItem = await prisma.wishlistItem.update({
//         where: { id: existingItem.id },
//         data: {
//           quantity: { increment: quantity },
//         },
//       });

//       return Response.json(updatedItem);
//     } else {
//       // ➕ Ajoute la carte à la wishlist
//       const createdItem = await prisma.wishlistItem.create({
//         data: {
//           scryfallId,
//           quantity,
//           wishlist: {
//             connect: { id: wishlistId },
//           },
//         },
//       });

//       return Response.json(createdItem);
//     }

//   } catch (error) {
//     console.error("❌ Erreur POST wishlist item:", error);
//     return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
//   }
// }



// PATCH – Met à jour la quantité ou déplace une carte vers une autre liste
export async function PATCH(request, { params }) {
  const { userId } = await params;
  const { itemId, quantityDelta = 0, newListId } = await request.json();

  if (!itemId) {
    return new Response(JSON.stringify({ error: "ID item manquant" }), { status: 400 });
  }

  try {
    const item = await prisma.wishlistItem.findFirst({ where: { id: itemId, userId } });
    if (!item) {
      return new Response(JSON.stringify({ error: "Item introuvable" }), { status: 404 });
    }

    const newQuantity = item.quantity + quantityDelta;
    if (newQuantity < 1) {
      await prisma.wishlistItem.delete({ where: { id: itemId } });
      return new Response(null, { status: 204 });
    }

    const updated = await prisma.wishlistItem.update({
      where: { id: itemId },
      data: {
        quantity: newQuantity,
        listId: newListId || item.listId,
      },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Erreur PATCH wishlist item:", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
}

// DELETE – Supprime un item OU tous les items d'une wishlist
export async function DELETE(request, { params }) {
  const { userId } = await params;
  const { scryfallId, wishlistId } = await request.json();
  console.log("UserId de la route DELETE", userId)
  console.log("entrée dans la route de delete", scryfallId)

  if (!userId) {
    return new Response(JSON.stringify({ error: "userId manquant" }), { status: 400 });
  }

  try {
    const existing = await prisma.wishlistItem.findFirst({
      where: {
        scryfallId
      }
    });
    console.log("existing", existing)
    
    if (!existing) {
      return new Response(JSON.stringify({ error: "Carte non trouvée" }), { status: 404 });
    }

    // Suppression d'un seul item
    await prisma.wishlistItem.delete({
      where: { id: existing.id },
    });
    return new Response(null, { status: 204 });

    if (wishlistId) {
      // Vérifie que la liste appartient bien à l'utilisateur
      const list = await prisma.wishlistList.findUnique({
        where: { id: wishlistId },
      });

      if (!list || list.userId !== userId) {
        return new Response(JSON.stringify({ error: "Liste non trouvée ou non autorisée" }), {
          status: 403,
        });
      }

      // Supprime tous les items liés à cette wishlist
      await prisma.wishlistItem.deleteMany({
        where: {
          wishlistId,
        },
      });

      return new Response(null, { status: 204 });
    }

    return new Response(JSON.stringify({ error: "itemId ou wishlistId requis" }), { status: 400 });

  } catch (error) {
    console.error("❌ Erreur DELETE wishlist item(s):", error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
  }
}