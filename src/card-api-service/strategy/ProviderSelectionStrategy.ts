/**
 * Stratégies de sélection de provider pour le Card API Service
 */

export interface ProviderInfo {
  name: string
  priority: number
  health: boolean
  responseTime: number
  successRate: number
  lastUsed: number
}

export interface SelectionContext {
  requestType: 'card' | 'set' | 'search' | 'price'
  query?: string
  cardId?: string
  setCode?: string
  preferences?: {
    prioritizeSpeed?: boolean
    prioritizeAccuracy?: boolean
    excludeProviders?: string[]
  }
}

/**
 * Interface pour les stratégies de sélection de provider
 */
export interface IProviderSelectionStrategy {
  selectProvider(providers: ProviderInfo[], context: SelectionContext): string | null
  updateProviderInfo(providerName: string, info: Partial<ProviderInfo>): void
}

/**
 * Stratégie de sélection par priorité fixe
 */
export class PriorityBasedStrategy implements IProviderSelectionStrategy {
  private providerInfos: Map<string, ProviderInfo> = new Map()

  selectProvider(providers: ProviderInfo[], context: SelectionContext): string | null {
    // Filtrer les providers selon les préférences
    let availableProviders = providers.filter(provider => {
      if (!provider.health) return false
      if (context.preferences?.excludeProviders?.includes(provider.name)) return false
      return true
    })

    if (availableProviders.length === 0) {
      return null
    }

    // Trier par priorité (plus bas = plus prioritaire)
    availableProviders.sort((a, b) => a.priority - b.priority)

    return availableProviders[0].name
  }

  updateProviderInfo(providerName: string, info: Partial<ProviderInfo>): void {
    const current = this.providerInfos.get(providerName) || {
      name: providerName,
      priority: 1,
      health: true,
      responseTime: 0,
      successRate: 100,
      lastUsed: 0
    }

    this.providerInfos.set(providerName, { ...current, ...info })
  }
}

/**
 * Stratégie de sélection basée sur les performances
 */
export class PerformanceBasedStrategy implements IProviderSelectionStrategy {
  private providerInfos: Map<string, ProviderInfo> = new Map()

  selectProvider(providers: ProviderInfo[], context: SelectionContext): string | null {
    // Filtrer les providers selon les préférences
    let availableProviders = providers.filter(provider => {
      if (!provider.health) return false
      if (context.preferences?.excludeProviders?.includes(provider.name)) return false
      return true
    })

    if (availableProviders.length === 0) {
      return null
    }

    // Calculer un score de performance pour chaque provider
    const scoredProviders = availableProviders.map(provider => {
      let score = 0

      // Score basé sur le temps de réponse (plus bas = mieux)
      const responseTimeScore = Math.max(0, 100 - (provider.responseTime / 10))
      score += responseTimeScore * 0.4

      // Score basé sur le taux de succès
      score += provider.successRate * 0.4

      // Score basé sur la priorité (plus bas = mieux)
      const priorityScore = Math.max(0, 10 - provider.priority)
      score += priorityScore * 0.2

      return {
        ...provider,
        score
      }
    })

    // Trier par score (plus haut = mieux)
    scoredProviders.sort((a, b) => b.score - a.score)

    return scoredProviders[0].name
  }

  updateProviderInfo(providerName: string, info: Partial<ProviderInfo>): void {
    const current = this.providerInfos.get(providerName) || {
      name: providerName,
      priority: 1,
      health: true,
      responseTime: 1000,
      successRate: 100,
      lastUsed: 0
    }

    this.providerInfos.set(providerName, { ...current, ...info })
  }
}

/**
 * Stratégie de sélection par round-robin
 */
export class RoundRobinStrategy implements IProviderSelectionStrategy {
  private providerInfos: Map<string, ProviderInfo> = new Map()
  private lastSelectedIndex: number = -1

  selectProvider(providers: ProviderInfo[], context: SelectionContext): string | null {
    // Filtrer les providers selon les préférences
    let availableProviders = providers.filter(provider => {
      if (!provider.health) return false
      if (context.preferences?.excludeProviders?.includes(provider.name)) return false
      return true
    })

    if (availableProviders.length === 0) {
      return null
    }

    // Sélectionner le prochain provider dans l'ordre
    this.lastSelectedIndex = (this.lastSelectedIndex + 1) % availableProviders.length
    const selectedProvider = availableProviders[this.lastSelectedIndex]

    // Mettre à jour le timestamp de dernière utilisation
    this.updateProviderInfo(selectedProvider.name, { lastUsed: Date.now() })

    return selectedProvider.name
  }

  updateProviderInfo(providerName: string, info: Partial<ProviderInfo>): void {
    const current = this.providerInfos.get(providerName) || {
      name: providerName,
      priority: 1,
      health: true,
      responseTime: 0,
      successRate: 100,
      lastUsed: 0
    }

    this.providerInfos.set(providerName, { ...current, ...info })
  }
}

/**
 * Stratégie de sélection adaptative
 */
export class AdaptiveStrategy implements IProviderSelectionStrategy {
  private providerInfos: Map<string, ProviderInfo> = new Map()
  private requestHistory: Array<{
    provider: string
    success: boolean
    responseTime: number
    timestamp: number
  }> = []

  selectProvider(providers: ProviderInfo[], context: SelectionContext): string | null {
    // Filtrer les providers selon les préférences
    let availableProviders = providers.filter(provider => {
      if (!provider.health) return false
      if (context.preferences?.excludeProviders?.includes(provider.name)) return false
      return true
    })

    if (availableProviders.length === 0) {
      return null
    }

    // Calculer les métriques récentes pour chaque provider
    const recentHistory = this.requestHistory.filter(
      entry => Date.now() - entry.timestamp < 5 * 60 * 1000 // 5 minutes
    )

    const scoredProviders = availableProviders.map(provider => {
      const providerHistory = recentHistory.filter(entry => entry.provider === provider.name)
      
      let score = 0

      if (providerHistory.length > 0) {
        const successRate = providerHistory.filter(entry => entry.success).length / providerHistory.length
        const avgResponseTime = providerHistory.reduce((sum, entry) => sum + entry.responseTime, 0) / providerHistory.length
        
        score = successRate * 100 - (avgResponseTime / 10)
      } else {
        // Utiliser les métriques par défaut si pas d'historique
        score = provider.successRate - (provider.responseTime / 10)
      }

      return {
        ...provider,
        score
      }
    })

    // Trier par score (plus haut = mieux)
    scoredProviders.sort((a, b) => b.score - a.score)

    const selectedProvider = scoredProviders[0]
    this.updateProviderInfo(selectedProvider.name, { lastUsed: Date.now() })

    return selectedProvider.name
  }

  updateProviderInfo(providerName: string, info: Partial<ProviderInfo>): void {
    const current = this.providerInfos.get(providerName) || {
      name: providerName,
      priority: 1,
      health: true,
      responseTime: 1000,
      successRate: 100,
      lastUsed: 0
    }

    this.providerInfos.set(providerName, { ...current, ...info })
  }

  /**
   * Enregistre le résultat d'une requête
   */
  recordRequest(provider: string, success: boolean, responseTime: number): void {
    this.requestHistory.push({
      provider,
      success,
      responseTime,
      timestamp: Date.now()
    })

    // Nettoyer l'historique ancien
    this.requestHistory = this.requestHistory.filter(
      entry => Date.now() - entry.timestamp < 24 * 60 * 60 * 1000 // 24 heures
    )
  }
}

/**
 * Factory pour créer des stratégies de sélection
 */
export class ProviderSelectionStrategyFactory {
  static create(type: 'priority' | 'performance' | 'round-robin' | 'adaptive'): IProviderSelectionStrategy {
    switch (type) {
      case 'priority':
        return new PriorityBasedStrategy()
      case 'performance':
        return new PerformanceBasedStrategy()
      case 'round-robin':
        return new RoundRobinStrategy()
      case 'adaptive':
        return new AdaptiveStrategy()
      default:
        return new PriorityBasedStrategy()
    }
  }
}
