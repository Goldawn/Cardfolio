import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Récupérer les sets uniques depuis les cartes en BDD
    const setsData = await prisma.card.findMany({
      select: {
        setName: true,
        setCode: true,
      },
      distinct: ['setName', 'setCode'],
      where: {
        setName: { not: null },
        setCode: { not: null },
      },
    })

    // Calculer le nombre de cartes pour chaque set
    const gameSets = await Promise.all(
      setsData.map(async set => {
        const cardCount = await prisma.card.count({
          where: {
            setCode: set.setCode,
          },
        })

        return {
          id: set.setCode!,
          code: set.setCode!,
          name: set.setName!,
          releaseDate: '', // Pas stocké en BDD pour l'instant
          setType: 'expansion', // Par défaut
          cardCount: cardCount, // Nombre réel de cartes
          digital: false, // Par défaut
          iconUri: undefined, // Pas stocké en BDD pour l'instant
          parentSetCode: undefined,
        }
      })
    )

    return NextResponse.json({ sets: gameSets })
  } catch (error) {
    console.error('Erreur lors du chargement des sets:', error)
    return NextResponse.json(
      { error: 'Erreur lors du chargement des sets' },
      { status: 500 }
    )
  }
}
