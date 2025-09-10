import { NextResponse } from 'next/server'
import { cardApiManager } from '@/app/services/CardApiManager'

export async function GET() {
  try {
    const stats = cardApiManager.getMonitoringStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Erreur lors de la récupération des métriques:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques' },
      { status: 500 }
    )
  }
}
