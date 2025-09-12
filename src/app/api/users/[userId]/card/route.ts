import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Types pour les paramètres de route
interface RouteParams {
  params: Promise<{ userId: string }>
}

// Types pour les requêtes
interface CardUsageRequest {
  externalIds: string[]
}

interface CardUsage {
  collection: number
  wishlists: Array<{
    listId: string
    name: string
    quantity: number
  }>
  decklists: Array<{
    deckId: string
    name: string
    quantity: number
  }>
}

type CardUsageMap = Record<string, CardUsage>

// SETUP de la route pour récupérer
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { userId } = await params
  const { externalIds }: CardUsageRequest = await req.json()

  console.log('userID :', userId)
  console.log('externalIds :', externalIds)

  const [collection, wishlists] = await Promise.all([
    prisma.card.findMany({
      where: { userId: userId, externalId: { in: externalIds } } as any,
      select: { externalId: true, quantity: true },
    }),
    prisma.wishlistList.findMany({
      where: { userId },
      include: {
        cards: {
          where: { externalId: { in: externalIds } },
          select: { externalId: true, quantity: true },
        },
      },
    }),
  ])

  const usage: CardUsageMap = {}

  externalIds.forEach(id => {
    usage[id] = { collection: 0, wishlists: [], decklists: [] }
  })

  // Collection
  collection.forEach(item => {
    usage[item.externalId].collection = item.quantity
  })

  // Wishlists
  wishlists.forEach(list => {
    list.cards.forEach(item => {
      usage[item.externalId].wishlists.push({
        listId: list.id,
        name: list.name,
        quantity: item.quantity,
      })
    })
  })

  return Response.json(usage)
}
