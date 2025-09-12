import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Types pour les paramètres de route
interface RouteParams {
  params: Promise<{ userId: string }>
}

// Types pour les requêtes
interface AddWishlistItemRequest {
  scryfallId: string
  quantity?: number
}

// GET /api/users/[userId]/wishlist
// Renvoie toutes les cartes de wishlist de l'utilisateur, toutes listes confondues
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { userId } = await params

  try {
    const allItems = await prisma.wishlistItem.findMany({
      where: { userId: userId } as any,
      include: { list: true } as any,
      orderBy: { dateAdded: 'desc' },
    })

    return Response.json(allItems)
  } catch (error) {
    console.error('Erreur GET /wishlist :', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
    })
  }
}

// POST /api/users/[userId]/wishlist
// Ajoute une carte à la liste par défaut de l'utilisateur
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { userId } = await params
  const { scryfallId, quantity = 1 }: AddWishlistItemRequest =
    await request.json()

  if (!scryfallId || quantity < 1) {
    return new Response(JSON.stringify({ error: 'Données invalides' }), {
      status: 400,
    })
  }

  try {
    // Chercher la liste par défaut de l'utilisateur
    let defaultList = await prisma.wishlistList.findFirst({
      where: {
        userId: userId,
        isDefault: true,
      },
    })

    // Si elle n'existe pas, la créer
    if (!defaultList) {
      defaultList = await prisma.wishlistList.create({
        data: {
          name: 'Ma liste de souhaits',
          isDefault: true,
          user: { connect: { id: userId } },
        },
      })
    }

    // Vérifier si la carte est déjà présente dans cette liste
    const existing = await prisma.wishlistItem.findFirst({
      where: {
        userId: userId,
        listId: defaultList.id,
        scryfallId,
      } as any,
    })

    if (existing) {
      // Incrémenter la quantité
      const updated = await prisma.wishlistItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
        },
      })

      return Response.json(updated)
    } else {
      // Créer un nouvel item
      const newItem = await prisma.wishlistItem.create({
        data: {
          scryfallId,
          quantity,
          userId,
          listId: defaultList.id,
        } as any,
      })

      return Response.json(newItem)
    }
  } catch (error) {
    console.error('Erreur POST /wishlist :', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
    })
  }
}
