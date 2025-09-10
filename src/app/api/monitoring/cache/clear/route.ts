import { NextResponse } from 'next/server'
import { cardApiManager } from '@/app/services/CardApiManager'

export async function POST() {
  try {
    await cardApiManager.clearCache()
    return NextResponse.json({ message: 'Cache vidé avec succès' })
  } catch (error) {
    console.error('Erreur lors du vidage du cache:', error)
    return NextResponse.json(
      { error: 'Erreur lors du vidage du cache' },
      { status: 500 }
    )
  }
}
