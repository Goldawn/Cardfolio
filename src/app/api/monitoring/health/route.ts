import { NextResponse } from 'next/server'
import { cardApiManager } from '@/app/services/CardApiManager'

export async function GET() {
  try {
    const health = await cardApiManager.getHealthStatus()
    return NextResponse.json(health)
  } catch (error) {
    console.error('Erreur lors de la récupération de la santé:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la santé' },
      { status: 500 }
    )
  }
}
