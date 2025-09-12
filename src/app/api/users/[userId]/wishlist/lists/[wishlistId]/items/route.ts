import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Types pour les paramètres de route
interface RouteParams {
  params: Promise<{ userId: string; wishlistId: string }>
}

// Types pour les requêtes
interface AddWishlistItemRequest {
  externalId: string
  quantity?: number
}

interface UpdateWishlistItemRequest {
  externalId: string
  quantityDelta: number
}

interface DeleteWishlistItemRequest {
  externalId: string
}

// GET - Récupération de tous les items d'une liste spécifique
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { userId, wishlistId } = await params

  if (!userId || !wishlistId) {
    return NextResponse.json(
      { error: 'Paramètres requis manquants (userId, wishlistId)' },
      { status: 400 }
    )
  }

  try {
    const list = await prisma.wishlistList.findUnique({
      where: { id: wishlistId },
    })

    if (!list || list.userId !== userId) {
      return NextResponse.json(
        { error: 'Liste non trouvée ou non autorisée' },
        { status: 403 }
      )
    }

    const items = await prisma.card.findMany({
      where: {
        wishlistId,
      },
      orderBy: {
        dateAdded: 'desc',
      },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('❌ Erreur GET items par wishlist:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors du chargement des cartes' },
      { status: 500 }
    )
  }
}

// POST – Ajoute une carte à une liste de souhaits spécifique
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { userId, wishlistId } = await params
  const { externalId, quantity = 1 }: AddWishlistItemRequest =
    await request.json()

  if (!userId || !externalId || !wishlistId) {
    return new Response(
      JSON.stringify({
        error: 'Champs requis manquants (userId, externalId, wishlistId)',
      }),
      { status: 400 }
    )
  }

  try {
    const list = await prisma.wishlistList.findUnique({
      where: { id: wishlistId },
    })

    if (!list || list.userId !== userId) {
      return new Response(
        JSON.stringify({ error: 'Liste non trouvée ou non autorisée' }),
        {
          status: 403,
        }
      )
    }

    // Vérifie si la carte est déjà dans la liste
    const existingItem = await prisma.card.findFirst({
      where: {
        wishlistId,
        externalId,
      },
    })

    if (existingItem) {
      // Met à jour la quantité
      const updatedItem = await prisma.card.update({
        where: { id: existingItem.id },
        data: {
          quantity: { increment: quantity },
        },
      })

      return Response.json(updatedItem)
    } else {
      // Ajoute la carte à la wishlist
      const createdItem = await prisma.card.create({
        data: {
          externalId,
          quantity,
          wishlist: {
            connect: { id: wishlistId },
          },
        },
      })

      return Response.json(createdItem)
    }
  } catch (error) {
    console.error('❌ Erreur POST wishlist item:', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
    })
  }
}

// PATCH - Modification d'un item d'une wishlist spécifique
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  console.log('ENTREE dans le PATCH')
  const { userId, wishlistId } = await params
  const { externalId, quantityDelta }: UpdateWishlistItemRequest =
    await request.json()
  console.log('externalId', externalId, 'delta', quantityDelta)

  if (
    !userId ||
    !wishlistId ||
    !externalId ||
    typeof quantityDelta !== 'number'
  ) {
    return new Response(
      JSON.stringify({ error: 'Données manquantes ou invalides' }),
      {
        status: 400,
      }
    )
  }
  console.log('Accès autorisé à la modification')
  try {
    const item = await prisma.card.findFirst({
      where: {
        wishlistId,
        externalId,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'item non trouvée' }, { status: 404 })
    }

    const newQuantity = item.quantity + quantityDelta

    const updated = await prisma.card.update({
      where: { id: item.id },
      data: {
        quantity: newQuantity,
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error('Erreur PATCH collection :', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
    })
  }
}

// DELETE - Suppression d'un item d'une wishlist spécifique
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { userId, wishlistId } = await params
  const { externalId }: DeleteWishlistItemRequest = await request.json()

  if (!userId || !wishlistId || !externalId) {
    return NextResponse.json(
      { error: 'Paramètres requis manquants (userId, wishlistId, itemId)' },
      { status: 400 }
    )
  }

  try {
    const item = await prisma.card.findFirst({
      where: {
        wishlistId,
        externalId,
      },
    })
    console.log('item existant', item)

    if (!item) {
      return NextResponse.json({ error: 'item non trouvée' }, { status: 404 })
    }

    await prisma.card.delete({
      where: { id: item.id },
    })
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('❌ Erreur GET items par wishlist:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors du chargement des cartes' },
      { status: 500 }
    )
  }
}
