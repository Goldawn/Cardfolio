import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Types pour les paramètres de route
interface RouteParams {
  params: Promise<{ userId: string; deckId: string }>
}

// GET - Récupération de toutes les cartes d'un deck spécifique
export async function GET(_request: NextRequest, { params }: RouteParams) {
  console.log('ENTREE DANS LE ROUTE DE DECK ID')
  const { userId, deckId } = await params
  console.log('userId:', userId, 'deckId:', deckId)

  if (!userId || !deckId) {
    return NextResponse.json(
      { error: 'Paramètres requis manquants (userId, deckId)' },
      { status: 400 }
    )
  }

  try {
    const list = await prisma.decklist.findUnique({
      where: { id: deckId },
    })

    if (!list || list.userId !== userId) {
      return NextResponse.json(
        { error: 'deck non trouvé ou non autorisé' },
        { status: 403 }
      )
    }

    const items = await prisma.deckCard.findMany({
      where: {
        deckId,
      },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('❌ Erreur GET items par deck:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors du chargement des cartes' },
      { status: 500 }
    )
  }
}
