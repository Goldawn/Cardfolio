import type { ServiceConfig } from '../config'
import type { GameSet } from '../dto'
import type { ICardAdapter, ISetProvider } from '../interfaces'

/**
 * Service principal pour la gestion des sets de cartes
 * Fournit une interface unifiée pour tous les providers de sets
 */
export class SetService {
  private providers: Map<string, ISetProvider> = new Map()
  private adapters: Map<string, ICardAdapter> = new Map()
  private config: ServiceConfig
  private defaultProvider: string

  constructor(
    providers: Map<string, ISetProvider>,
    adapters: Map<string, ICardAdapter>,
    config: ServiceConfig
  ) {
    this.providers = providers
    this.adapters = adapters
    this.config = config
    this.defaultProvider = config.defaultProvider
  }

  /**
   * Récupère tous les sets disponibles
   */
  async fetchSets(providerName?: string): Promise<GameSet[]> {
    const provider = this.providers.get(providerName || this.defaultProvider)
    const adapter = this.adapters.get(providerName || this.defaultProvider)

    if (!provider || !adapter) {
      throw new Error(
        `Provider or adapter not found: ${providerName || this.defaultProvider}`
      )
    }

    try {
      const response = await provider.fetchSets()

      if (response.error) {
        // Tentative de fallback si configuré
        if (this.config.fallbackProviders.length > 0) {
          return this.fetchSetsWithFallback(providerName)
        }
        throw new Error(response.error.message)
      }

      // S'assurer que response.data est un tableau
      const dataArray = Array.isArray(response.data)
        ? response.data
        : [response.data]
      return adapter.transformSets(dataArray)
    } catch (error) {
      // Fallback automatique
      if (this.config.fallbackProviders.length > 0) {
        return this.fetchSetsWithFallback(providerName)
      }
      throw error
    }
  }

  /**
   * Récupère un set spécifique par son code
   */
  async fetchSet(
    setCode: string,
    providerName?: string
  ): Promise<GameSet | null> {
    const provider = this.providers.get(providerName || this.defaultProvider)
    const adapter = this.adapters.get(providerName || this.defaultProvider)

    if (!provider || !adapter) {
      throw new Error(
        `Provider or adapter not found: ${providerName || this.defaultProvider}`
      )
    }

    try {
      const response = await provider.fetchSet(setCode)

      if (response.error) {
        // Tentative de fallback si configuré
        if (this.config.fallbackProviders.length > 0) {
          return this.fetchSetWithFallback(setCode, providerName)
        }
        throw new Error(response.error.message)
      }

      // S'assurer que response.data est un tableau
      const dataArray = Array.isArray(response.data)
        ? response.data
        : [response.data]
      const sets = adapter.transformSets(dataArray)
      return sets.length > 0 ? sets[0] : null
    } catch (error) {
      // Fallback automatique
      if (this.config.fallbackProviders.length > 0) {
        return this.fetchSetWithFallback(setCode, providerName)
      }
      throw error
    }
  }

  /**
   * Récupère les sets par type
   */
  async fetchSetsByType(
    setType: string,
    providerName?: string
  ): Promise<GameSet[]> {
    const provider = this.providers.get(providerName || this.defaultProvider)
    const adapter = this.adapters.get(providerName || this.defaultProvider)

    if (!provider || !adapter) {
      throw new Error(
        `Provider or adapter not found: ${providerName || this.defaultProvider}`
      )
    }

    try {
      const response = await provider.fetchSetsByType(setType)

      if (response.error) {
        // Tentative de fallback si configuré
        if (this.config.fallbackProviders.length > 0) {
          return this.fetchSetsByTypeWithFallback(setType, providerName)
        }
        throw new Error(response.error.message)
      }

      // S'assurer que response.data est un tableau
      const dataArray = Array.isArray(response.data)
        ? response.data
        : [response.data]
      return adapter.transformSets(dataArray)
    } catch (error) {
      // Fallback automatique
      if (this.config.fallbackProviders.length > 0) {
        return this.fetchSetsByTypeWithFallback(setType, providerName)
      }
      throw error
    }
  }

  /**
   * Recherche des sets par nom ou code
   */
  async searchSets(query: string, providerName?: string): Promise<GameSet[]> {
    try {
      const allSets = await this.fetchSets(providerName)

      // Filtrage local par nom ou code
      const filteredSets = allSets.filter(
        set =>
          set.name.toLowerCase().includes(query.toLowerCase()) ||
          set.code.toLowerCase().includes(query.toLowerCase())
      )

      return filteredSets
    } catch (error) {
      // Fallback vers un autre provider
      if (this.config.fallbackProviders.length > 0) {
        return this.searchSetsWithFallback(query, providerName)
      }
      throw error
    }
  }

  /**
   * Récupère les sets récents (derniers 6 mois)
   */
  async fetchRecentSets(providerName?: string): Promise<GameSet[]> {
    try {
      const allSets = await this.fetchSets(providerName)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const recentSets = allSets.filter(set => {
        const releaseDate = new Date(set.releaseDate)
        return releaseDate >= sixMonthsAgo
      })

      // Trier par date de sortie (plus récent en premier)
      return recentSets.sort(
        (a, b) =>
          new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      )
    } catch (error) {
      // Fallback vers un autre provider
      if (this.config.fallbackProviders.length > 0) {
        return this.fetchRecentSetsWithFallback(providerName)
      }
      throw error
    }
  }

  /**
   * Récupère les sets par format (Standard, Modern, etc.)
   */
  async fetchSetsByFormat(
    format: string,
    providerName?: string
  ): Promise<GameSet[]> {
    try {
      const allSets = await this.fetchSets(providerName)

      // Mapping des formats vers les types de sets
      const formatToSetTypes: Record<string, string[]> = {
        standard: ['core', 'expansion', 'draft_innovation'],
        modern: ['core', 'expansion', 'masters'],
        legacy: ['core', 'expansion', 'masters', 'commander'],
        commander: ['commander', 'core', 'expansion'],
        pioneer: ['core', 'expansion', 'draft_innovation'],
      }

      const allowedSetTypes = formatToSetTypes[format.toLowerCase()] || []

      if (allowedSetTypes.length === 0) {
        return allSets // Retourner tous les sets si format non reconnu
      }

      return allSets.filter(set =>
        allowedSetTypes.some(type => set.setType.toLowerCase().includes(type))
      )
    } catch (error) {
      // Fallback vers un autre provider
      if (this.config.fallbackProviders.length > 0) {
        return this.fetchSetsByFormatWithFallback(format, providerName)
      }
      throw error
    }
  }

  /**
   * Vérifie la santé de tous les providers
   */
  async checkProvidersHealth(): Promise<Record<string, boolean>> {
    const healthStatus: Record<string, boolean> = {}

    for (const [name, provider] of this.providers) {
      try {
        healthStatus[name] = await provider.isHealthy()
      } catch (_error) {
        healthStatus[name] = false
      }
    }

    return healthStatus
  }

  /**
   * Retourne la liste des providers disponibles
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Retourne le provider par défaut
   */
  getDefaultProvider(): string {
    return this.defaultProvider
  }

  // Méthodes de fallback privées
  private async fetchSetsWithFallback(
    _providerName?: string
  ): Promise<GameSet[]> {
    for (const fallbackProvider of this.config.fallbackProviders) {
      try {
        return await this.fetchSets(fallbackProvider)
      } catch (error) {
        console.warn(`Fallback provider ${fallbackProvider} failed:`, error)
        continue
      }
    }
    throw new Error('All providers failed')
  }

  private async fetchSetWithFallback(
    setCode: string,
    _providerName?: string
  ): Promise<GameSet | null> {
    for (const fallbackProvider of this.config.fallbackProviders) {
      try {
        return await this.fetchSet(setCode, fallbackProvider)
      } catch (error) {
        console.warn(`Fallback provider ${fallbackProvider} failed:`, error)
        continue
      }
    }
    throw new Error('All providers failed')
  }

  private async fetchSetsByTypeWithFallback(
    setType: string,
    _providerName?: string
  ): Promise<GameSet[]> {
    for (const fallbackProvider of this.config.fallbackProviders) {
      try {
        return await this.fetchSetsByType(setType, fallbackProvider)
      } catch (error) {
        console.warn(`Fallback provider ${fallbackProvider} failed:`, error)
        continue
      }
    }
    throw new Error('All providers failed')
  }

  private async searchSetsWithFallback(
    query: string,
    _providerName?: string
  ): Promise<GameSet[]> {
    for (const fallbackProvider of this.config.fallbackProviders) {
      try {
        return await this.searchSets(query, fallbackProvider)
      } catch (error) {
        console.warn(`Fallback provider ${fallbackProvider} failed:`, error)
        continue
      }
    }
    throw new Error('All providers failed')
  }

  private async fetchRecentSetsWithFallback(
    _providerName?: string
  ): Promise<GameSet[]> {
    for (const fallbackProvider of this.config.fallbackProviders) {
      try {
        return await this.fetchRecentSets(fallbackProvider)
      } catch (error) {
        console.warn(`Fallback provider ${fallbackProvider} failed:`, error)
        continue
      }
    }
    throw new Error('All providers failed')
  }

  private async fetchSetsByFormatWithFallback(
    format: string,
    _providerName?: string
  ): Promise<GameSet[]> {
    for (const fallbackProvider of this.config.fallbackProviders) {
      try {
        return await this.fetchSetsByFormat(format, fallbackProvider)
      } catch (error) {
        console.warn(`Fallback provider ${fallbackProvider} failed:`, error)
        continue
      }
    }
    throw new Error('All providers failed')
  }
}
