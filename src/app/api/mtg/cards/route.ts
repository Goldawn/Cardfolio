import { prisma } from '@/lib/prisma'
import { transformPrismaResults } from '@/types/utils/cardHelpers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const setCode = searchParams.get('setCode')

    if (!setCode) {
      return NextResponse.json({ error: 'setCode est requis' }, { status: 400 })
    }

    // Recherche des cartes du set avec Prisma
    const results = await prisma.card.findMany({
      where: {
        setCode: setCode,
      },
      select: {
        id: true,
        externalId: true,
        name: true,
        gameType: true,
        gameData: true,
        imageSmall: true,
        imageNormal: true,
        imageLarge: true,
        setCode: true,
        setName: true,
        rarity: true,
        artist: true,
        collectorNumber: true,
      },
      take: 100, // Limiter les résultats
    })

    // Transformer les résultats pour correspondre au format GameCard
    const formattedCards = transformPrismaResults(results)

    return NextResponse.json({ cards: formattedCards })
  } catch (error) {
    console.error('Erreur lors du chargement des cartes:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des cartes' },
      { status: 500 }
    )
  }
}
