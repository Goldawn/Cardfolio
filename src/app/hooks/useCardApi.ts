/**
 * Hook React personnalisé pour utiliser le CardApiManager
 * Fournit une interface React-friendly pour les services de cartes
 */

import { useState, useEffect, useCallback } from 'react'
import { cardApiManager } from '@/app/services/CardApiManager'
import type { GameCard } from '@/types'
import type { GameSet } from '@/card-api-service/dto'

export interface UseCardApiReturn {
  // État
  loading: boolean
  error: string | null
  healthStatus: any | null
  
  // Actions
  fetchCard: (cardId: string) => Promise<GameCard | null>
  searchCards: (query: string, options?: any) => Promise<GameCard[]>
  fetchSets: () => Promise<GameSet[]>
  fetchCardPrice: (cardName: string) => Promise<{ usd: number; eur: number }>
  getAutocompleteSuggestions: (query: string) => Promise<string[]>
  
  // Monitoring
  getMonitoringStats: () => any
  clearCache: () => Promise<void>
}

export const useCardApi = (): UseCardApiReturn => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [healthStatus, setHealthStatus] = useState<any | null>(null)

  // Mise à jour périodique de la santé du service
  useEffect(() => {
    const updateHealth = async () => {
      try {
        const health = await cardApiManager.getHealthStatus()
        setHealthStatus(health)
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la santé:', error)
      }
    }

    updateHealth()
    const interval = setInterval(updateHealth, 60000) // Toutes les minutes

    return () => clearInterval(interval)
  }, [])

  // Fonction wrapper pour gérer les erreurs
  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await operation()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue'
      setError(`${operationName}: ${errorMessage}`)
      console.error(`Erreur ${operationName}:`, err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Actions
  const fetchCard = useCallback(async (cardId: string): Promise<GameCard | null> => {
    return await withErrorHandling(
      () => cardApiManager.fetchCard(cardId),
      'fetchCard'
    ) as GameCard | null
  }, [withErrorHandling])

  const searchCards = useCallback(async (query: string, options?: any): Promise<GameCard[]> => {
    const result = await withErrorHandling(
      () => cardApiManager.searchCards(query, options),
      'searchCards'
    )
    return result || []
  }, [withErrorHandling])

  const fetchSets = useCallback(async (): Promise<GameSet[]> => {
    const result = await withErrorHandling(
      () => cardApiManager.fetchSets(),
      'fetchSets'
    )
    return result || []
  }, [withErrorHandling])

  const fetchCardPrice = useCallback(async (cardName: string): Promise<{ usd: number; eur: number }> => {
    const result = await withErrorHandling(
      () => cardApiManager.fetchCardPrice(cardName),
      'fetchCardPrice'
    )
    return result || { usd: 0, eur: 0 }
  }, [withErrorHandling])

  const getAutocompleteSuggestions = useCallback(async (query: string): Promise<string[]> => {
    const result = await withErrorHandling(
      () => cardApiManager.getAutocompleteSuggestions(query),
      'getAutocompleteSuggestions'
    )
    return result || []
  }, [withErrorHandling])

  const getMonitoringStats = useCallback(() => {
    return cardApiManager.getMonitoringStats()
  }, [])

  const clearCache = useCallback(async (): Promise<void> => {
    await withErrorHandling(
      () => cardApiManager.clearCache(),
      'clearCache'
    )
  }, [withErrorHandling])

  return {
    // État
    loading,
    error,
    healthStatus,
    
    // Actions
    fetchCard,
    searchCards,
    fetchSets,
    fetchCardPrice,
    getAutocompleteSuggestions,
    
    // Monitoring
    getMonitoringStats,
    clearCache
  }
}

// Hook spécialisé pour la recherche de cartes
export const useCardSearch = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GameCard[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const { loading, error, searchCards, getAutocompleteSuggestions } = useCardApi()

  // Recherche de cartes
  const search = useCallback(async (searchQuery: string, options?: any) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const searchResults = await searchCards(searchQuery, options)
    setResults(searchResults)
    setQuery(searchQuery)
  }, [searchCards])

  // Suggestions d'autocomplete
  const updateSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    const newSuggestions = await getAutocompleteSuggestions(searchQuery)
    setSuggestions(newSuggestions)
  }, [getAutocompleteSuggestions])

  return {
    query,
    results,
    suggestions,
    loading,
    error,
    search,
    updateSuggestions,
    setQuery,
    setResults,
    setSuggestions
  }
}

// Hook spécialisé pour les sets
export const useSets = () => {
  const [sets, setSets] = useState<GameSet[]>([])
  const { loading, error, fetchSets } = useCardApi()

  const loadSets = useCallback(async () => {
    const setsData = await fetchSets()
    setSets(setsData)
  }, [fetchSets])

  useEffect(() => {
    loadSets()
  }, [loadSets])

  return {
    sets,
    loading,
    error,
    refetch: loadSets
  }
}

// Hook spécialisé pour les prix
export const useCardPrice = (cardName: string) => {
  const [price, setPrice] = useState<{ usd: number; eur: number }>({ usd: 0, eur: 0 })
  const { loading, error, fetchCardPrice } = useCardApi()

  const loadPrice = useCallback(async () => {
    if (!cardName.trim()) return
    
    const priceData = await fetchCardPrice(cardName)
    setPrice(priceData)
  }, [cardName, fetchCardPrice])

  useEffect(() => {
    loadPrice()
  }, [loadPrice])

  return {
    price,
    loading,
    error,
    refetch: loadPrice
  }
}
