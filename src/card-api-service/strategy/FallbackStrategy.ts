/**
 * Stratégies de fallback pour le Card API Service
 */

export interface FallbackConfig {
  enabled: boolean
  maxRetries: number
  retryDelay: number // en millisecondes
  backoffMultiplier: number
  maxRetryDelay: number // en millisecondes
  retryableErrors: string[] // codes d'erreur qui peuvent être retryés
}

export interface FallbackContext {
  originalProvider: string
  failedProviders: string[]
  attemptCount: number
  lastError?: Error
  requestType: 'card' | 'set' | 'search' | 'price'
}

export interface FallbackResult<T> {
  success: boolean
  data?: T
  error?: Error
  provider: string
  attemptCount: number
  totalTime: number
}

/**
 * Interface pour les stratégies de fallback
 */
export interface IFallbackStrategy {
  shouldRetry(context: FallbackContext): boolean
  getNextProvider(availableProviders: string[], context: FallbackContext): string | null
  getRetryDelay(context: FallbackContext): number
  isRetryableError(error: Error): boolean
}

/**
 * Stratégie de fallback simple
 */
export class SimpleFallbackStrategy implements IFallbackStrategy {
  private config: FallbackConfig

  constructor(config: FallbackConfig) {
    this.config = config
  }

  shouldRetry(context: FallbackContext): boolean {
    if (!this.config.enabled) return false
    if (context.attemptCount >= this.config.maxRetries) return false
    if (!this.isRetryableError(context.lastError!)) return false
    
    return true
  }

  getNextProvider(availableProviders: string[], context: FallbackContext): string | null {
    // Exclure les providers qui ont déjà échoué
    const remainingProviders = availableProviders.filter(
      provider => !context.failedProviders.includes(provider)
    )

    if (remainingProviders.length === 0) {
      return null
    }

    // Retourner le premier provider disponible
    return remainingProviders[0]
  }

  getRetryDelay(context: FallbackContext): number {
    const baseDelay = this.config.retryDelay
    const multiplier = Math.pow(this.config.backoffMultiplier, context.attemptCount - 1)
    const delay = baseDelay * multiplier
    
    return Math.min(delay, this.config.maxRetryDelay)
  }

  isRetryableError(error: Error): boolean {
    if (!error) return false
    
    const errorMessage = error.message.toLowerCase()
    return this.config.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    )
  }
}

/**
 * Stratégie de fallback avec backoff exponentiel
 */
export class ExponentialBackoffFallbackStrategy implements IFallbackStrategy {
  private config: FallbackConfig

  constructor(config: FallbackConfig) {
    this.config = config
  }

  shouldRetry(context: FallbackContext): boolean {
    if (!this.config.enabled) return false
    if (context.attemptCount >= this.config.maxRetries) return false
    if (!this.isRetryableError(context.lastError!)) return false
    
    return true
  }

  getNextProvider(availableProviders: string[], context: FallbackContext): string | null {
    // Exclure les providers qui ont déjà échoué
    const remainingProviders = availableProviders.filter(
      provider => !context.failedProviders.includes(provider)
    )

    if (remainingProviders.length === 0) {
      return null
    }

    // Utiliser une stratégie de sélection basée sur la priorité
    // (peut être améliorée avec des métriques de performance)
    return remainingProviders[0]
  }

  getRetryDelay(context: FallbackContext): number {
    const baseDelay = this.config.retryDelay
    const multiplier = Math.pow(this.config.backoffMultiplier, context.attemptCount - 1)
    const delay = baseDelay * multiplier
    
    // Ajouter un jitter aléatoire pour éviter le thundering herd
    const jitter = Math.random() * 0.1 * delay
    
    return Math.min(delay + jitter, this.config.maxRetryDelay)
  }

  isRetryableError(error: Error): boolean {
    if (!error) return false
    
    const errorMessage = error.message.toLowerCase()
    return this.config.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    )
  }
}

/**
 * Stratégie de fallback intelligente
 */
export class IntelligentFallbackStrategy implements IFallbackStrategy {
  private config: FallbackConfig
  private providerHealth: Map<string, {
    lastFailure: number
    failureCount: number
    successRate: number
  }> = new Map()

  constructor(config: FallbackConfig) {
    this.config = config
  }

  shouldRetry(context: FallbackContext): boolean {
    if (!this.config.enabled) return false
    if (context.attemptCount >= this.config.maxRetries) return false
    if (!this.isRetryableError(context.lastError!)) return false
    
    return true
  }

  getNextProvider(availableProviders: string[], context: FallbackContext): string | null {
    // Exclure les providers qui ont déjà échoué
    const remainingProviders = availableProviders.filter(
      provider => !context.failedProviders.includes(provider)
    )

    if (remainingProviders.length === 0) {
      return null
    }

    // Trier les providers par santé et performance
    const scoredProviders = remainingProviders.map(provider => {
      const health = this.providerHealth.get(provider) || {
        lastFailure: 0,
        failureCount: 0,
        successRate: 100
      }

      let score = health.successRate

      // Pénaliser les providers qui ont échoué récemment
      const timeSinceLastFailure = Date.now() - health.lastFailure
      if (timeSinceLastFailure < 5 * 60 * 1000) { // 5 minutes
        score *= 0.5
      }

      // Pénaliser les providers avec beaucoup d'échecs
      if (health.failureCount > 5) {
        score *= 0.3
      }

      return { provider, score }
    })

    // Trier par score (plus haut = mieux)
    scoredProviders.sort((a, b) => b.score - a.score)

    return scoredProviders[0].provider
  }

  getRetryDelay(context: FallbackContext): number {
    const baseDelay = this.config.retryDelay
    const multiplier = Math.pow(this.config.backoffMultiplier, context.attemptCount - 1)
    const delay = baseDelay * multiplier
    
    // Ajuster le délai basé sur l'historique du provider
    const lastProvider = context.failedProviders[context.failedProviders.length - 1]
    const health = this.providerHealth.get(lastProvider)
    
    if (health && health.failureCount > 3) {
      // Augmenter le délai pour les providers problématiques
      return Math.min(delay * 2, this.config.maxRetryDelay)
    }
    
    return Math.min(delay, this.config.maxRetryDelay)
  }

  isRetryableError(error: Error): boolean {
    if (!error) return false
    
    const errorMessage = error.message.toLowerCase()
    return this.config.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase())
    )
  }

  /**
   * Enregistre un échec pour un provider
   */
  recordFailure(provider: string): void {
    const health = this.providerHealth.get(provider) || {
      lastFailure: 0,
      failureCount: 0,
      successRate: 100
    }

    health.lastFailure = Date.now()
    health.failureCount++
    health.successRate = Math.max(0, health.successRate - 10)

    this.providerHealth.set(provider, health)
  }

  /**
   * Enregistre un succès pour un provider
   */
  recordSuccess(provider: string): void {
    const health = this.providerHealth.get(provider) || {
      lastFailure: 0,
      failureCount: 0,
      successRate: 100
    }

    health.failureCount = Math.max(0, health.failureCount - 1)
    health.successRate = Math.min(100, health.successRate + 5)

    this.providerHealth.set(provider, health)
  }
}

/**
 * Service de fallback principal
 */
export class FallbackService {
  private strategy: IFallbackStrategy
  private config: FallbackConfig

  constructor(strategy: IFallbackStrategy, config: FallbackConfig) {
    this.strategy = strategy
    this.config = config
  }

  /**
   * Exécute une opération avec fallback
   */
  async executeWithFallback<T>(
    operation: (provider: string) => Promise<T>,
    availableProviders: string[],
    requestType: 'card' | 'set' | 'search' | 'price',
    originalProvider?: string
  ): Promise<FallbackResult<T>> {
    const startTime = Date.now()
    const context: FallbackContext = {
      originalProvider: originalProvider || availableProviders[0],
      failedProviders: [],
      attemptCount: 0,
      requestType
    }

    let currentProvider = originalProvider || availableProviders[0]

    while (this.strategy.shouldRetry(context)) {
      context.attemptCount++
      
      try {
        const data = await operation(currentProvider)
        
        // Enregistrer le succès si c'est une stratégie intelligente
        if (this.strategy instanceof IntelligentFallbackStrategy) {
          this.strategy.recordSuccess(currentProvider)
        }

        return {
          success: true,
          data,
          provider: currentProvider,
          attemptCount: context.attemptCount,
          totalTime: Date.now() - startTime
        }
      } catch (error) {
        context.lastError = error as Error
        context.failedProviders.push(currentProvider)

        // Enregistrer l'échec si c'est une stratégie intelligente
        if (this.strategy instanceof IntelligentFallbackStrategy) {
          this.strategy.recordFailure(currentProvider)
        }

        // Obtenir le prochain provider
        const nextProvider = this.strategy.getNextProvider(availableProviders, context)
        
        if (!nextProvider) {
          // Plus de providers disponibles
          break
        }

        currentProvider = nextProvider

        // Attendre avant de réessayer
        if (this.strategy.shouldRetry(context)) {
          const delay = this.strategy.getRetryDelay(context)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    return {
      success: false,
      error: context.lastError,
      provider: currentProvider,
      attemptCount: context.attemptCount,
      totalTime: Date.now() - startTime
    }
  }
}

/**
 * Configuration par défaut pour le fallback
 */
export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  enabled: true,
  maxRetries: 3,
  retryDelay: 1000, // 1 seconde
  backoffMultiplier: 2,
  maxRetryDelay: 30000, // 30 secondes
  retryableErrors: [
    'timeout',
    'network',
    'connection',
    'rate limit',
    'temporary',
    'server error',
    'service unavailable'
  ]
}
