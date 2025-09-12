import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Types pour les paramètres de route
interface RouteParams {
  params: Promise<{ userId: string }>
}

// Types pour les requêtes
interface AddCardRequest {
  externalId: string
  quantity: number
  priceHistory?: Array<{
    date: string
    usd: number
    eur: number
  }>
}

interface UpdateCardRequest {
  externalId: string
  quantityDelta: number
  newPriceEntry?: {
    date: string
    usd: number
    eur: number
  }
}

interface DeleteCardRequest {
  externalId: string
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { userId } = await params

  try {
    const defaultCollection = await prisma.collection.findFirst({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      include: { cards: true }, // <- CollectionItem[]
    })

    return Response.json(defaultCollection?.cards || [])
  } catch (error) {
    console.error('Erreur API collection :', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { userId } = await params
  const body: AddCardRequest = await request.json()

  const { externalId, quantity, priceHistory } = body

  if (!externalId || !quantity) {
    return new Response(JSON.stringify({ error: 'Données manquantes' }), {
      status: 400,
    })
  }

  try {
    const newCard = await prisma.card.create({
      data: {
        cardId: card.id,
        quantity,
        priceHistory: priceHistory || [],
        userId,
      } as any,
    })

    // 🆕 Création du log
    await prisma.collectionChangeLog.create({
      data: {
        userId,
        cardId: card.id,
        changeType: 'add',
        quantity,
        totalAfter: quantity,
      },
    })

    return Response.json(newCard)
  } catch (error) {
    console.error('Erreur ajout collection :', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
    })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { userId } = await params
  const { externalId, quantityDelta, newPriceEntry }: UpdateCardRequest =
    await request.json()

  if (!externalId || typeof quantityDelta !== 'number') {
    return new Response(
      JSON.stringify({ error: 'Données manquantes ou invalides' }),
      {
        status: 400,
      }
    )
  }

  try {
    const existing = await prisma.card.findFirst({
      where: {
        userId: userId,
        cardId: card.id,
      } as any,
    })

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Carte non trouvée' }), {
        status: 404,
      })
    }

    const newQuantity = existing.quantity + quantityDelta

    // 👇 Si on supprime la carte (quantité <= 0)
    if (newQuantity < 1) {
      await prisma.card.delete({
        where: { id: existing.id },
      })

      await prisma.collectionChangeLog.create({
        data: {
          userId,
          cardId: card.id,
          changeType: 'remove',
          quantity: quantityDelta,
          totalAfter: 0,
        },
      })

      return new Response(null, { status: 204 })
    }

    // 👇 Sinon, on met à jour la carte normalement
    const updated = await prisma.card.update({
      where: { id: existing.id },
      data: {
        quantity: newQuantity,
        priceHistory: {
          push: newPriceEntry ? [newPriceEntry] : [],
        },
      },
    })

    // 👇 Ajout dans le log
    await prisma.collectionChangeLog.create({
      data: {
        userId,
        cardId: card.id,
        changeType: quantityDelta > 0 ? 'add' : 'remove',
        quantity: quantityDelta,
        totalAfter: newQuantity,
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { userId } = await params
  const { externalId }: DeleteCardRequest = await request.json()

  if (!externalId) {
    return new Response(JSON.stringify({ error: 'externalId manquant' }), {
      status: 400,
    })
  }

  try {
    const existing = await prisma.card.findFirst({
      where: {
        userId: userId,
        cardId: card.id,
      } as any,
    })

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Carte non trouvée' }), {
        status: 404,
      })
    }

    await prisma.card.delete({
      where: { id: existing.id },
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Erreur DELETE collection :', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
    })
  }
}
