import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Types pour les paramètres de route
interface RouteParams {
  params: Promise<{ userId: string }>
}

// Types pour les requêtes
interface AddWishlistItemRequest {
  externalId: string
  quantity?: number
}

// GET /api/users/[userId]/wishlist
// Renvoie toutes les cartes de wishlist de l'utilisateur, toutes listes confondues
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { userId } = await params

  try {
    const allItems = await prisma.card.findMany({
      where: {
        wishlistId: { not: null },
        wishlistList: { userId: userId },
      },
      include: { wishlistList: true },
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
  const { externalId, quantity = 1 }: AddWishlistItemRequest =
    await request.json()

  if (!externalId || quantity < 1) {
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

    // Trouver la carte par externalId
    const card = await prisma.card.findFirst({
      where: { externalId },
      select: { id: true, quantity: true },
    })

    if (!card) {
      return new Response(JSON.stringify({ error: 'Carte non trouvée' }), {
        status: 404,
      })
    }

    // Vérifier si la carte est déjà présente dans cette liste
    const existing = await prisma.card.findFirst({
      where: {
        id: card.id,
        wishlistId: defaultList.id,
      },
    })

    if (existing) {
      // Incrémenter la quantité
      const updated = await prisma.card.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
        },
      })

      return Response.json(updated)
    } else {
      // Ajouter la carte à la wishlist
      const newItem = await prisma.card.update({
        where: { id: card.id },
        data: {
          wishlistId: defaultList.id,
          quantity: quantity,
        },
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
