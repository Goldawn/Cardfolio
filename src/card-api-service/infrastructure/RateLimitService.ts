/**
 * Service de rate limiting pour le Card API Service
 * Gère les limites de requêtes pour chaque provider
 */

export interface RateLimitConfig {
  enabled: boolean
  providers: Record<string, {
    requests: number
    per: 'second' | 'minute' | 'hour' | 'day'
    burst?: number // Nombre de requêtes autorisées en rafale
  }>
  global?: {
    requests: number
    per: 'second' | 'minute' | 'hour' | 'day'
  }
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export interface RateLimitResult {
  allowed: boolean
  info: RateLimitInfo
  retryAfter?: number
}

/**
 * Gestionnaire de rate limiting pour un provider
 */
class ProviderRateLimiter {
  private requests: number[] = []
  private config: RateLimitConfig['providers'][string]
  private providerName: string

  constructor(providerName: string, config: RateLimitConfig['providers'][string]) {
    this.providerName = providerName
    this.config = config
  }

  /**
   * Vérifie si une requête est autorisée
   */
  checkRequest(): RateLimitResult {
    const now = Date.now()
    const windowMs = this.getWindowMs()
    
    // Nettoyer les anciennes requêtes
    this.cleanup(now, windowMs)
    
    const limit = this.config.requests
    const remaining = Math.max(0, limit - this.requests.length)
    const resetTime = now + windowMs
    
    if (this.requests.length < limit) {
      // Autoriser la requête
      this.requests.push(now)
      return {
        allowed: true,
        info: {
          limit,
          remaining: remaining - 1,
          resetTime
        }
      }
    } else {
      // Refuser la requête
      const oldestRequest = Math.min(...this.requests)
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000)
      
      return {
        allowed: false,
        info: {
          limit,
          remaining: 0,
          resetTime
        },
        retryAfter
      }
    }
  }

  /**
   * Attend que la limite soit respectée
   */
  async waitForAvailability(): Promise<void> {
    const result = this.checkRequest()
    
    if (!result.allowed && result.retryAfter) {
      await new Promise(resolve => setTimeout(resolve, result.retryAfter! * 1000))
    }
  }

  /**
   * Obtient les informations de rate limiting
   */
  getInfo(): RateLimitInfo {
    const now = Date.now()
    const windowMs = this.getWindowMs()
    
    this.cleanup(now, windowMs)
    
    const limit = this.config.requests
    const remaining = Math.max(0, limit - this.requests.length)
    const resetTime = now + windowMs
    
    return {
      limit,
      remaining,
      resetTime
    }
  }

  /**
   * Convertit la période en millisecondes
   */
  private getWindowMs(): number {
    switch (this.config.per) {
      case 'second': return 1000
      case 'minute': return 60 * 1000
      case 'hour': return 60 * 60 * 1000
      case 'day': return 24 * 60 * 60 * 1000
      default: return 60 * 1000
    }
  }

  /**
   * Nettoie les anciennes requêtes
   */
  private cleanup(now: number, windowMs: number): void {
    const cutoff = now - windowMs
    this.requests = this.requests.filter(timestamp => timestamp > cutoff)
  }
}

/**
 * Service de rate limiting principal
 */
export class RateLimitService {
  private limiters: Map<string, ProviderRateLimiter> = new Map()
  private globalLimiter?: ProviderRateLimiter
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    
    // Initialiser les limiteurs pour chaque provider
    for (const [providerName, providerConfig] of Object.entries(config.providers)) {
      this.limiters.set(providerName, new ProviderRateLimiter(providerName, providerConfig))
    }
    
    // Initialiser le limiteur global si configuré
    if (config.global) {
      this.globalLimiter = new ProviderRateLimiter('global', config.global)
    }
  }

  /**
   * Vérifie si une requête est autorisée pour un provider
   */
  checkRequest(providerName: string): RateLimitResult {
    if (!this.config.enabled) {
      return {
        allowed: true,
        info: {
          limit: Infinity,
          remaining: Infinity,
          resetTime: Date.now()
        }
      }
    }

    // Vérifier la limite globale d'abord
    if (this.globalLimiter) {
      const globalResult = this.globalLimiter.checkRequest()
      if (!globalResult.allowed) {
        return globalResult
      }
    }

    // Vérifier la limite du provider
    const limiter = this.limiters.get(providerName)
    if (!limiter) {
      // Pas de limite configurée pour ce provider
      return {
        allowed: true,
        info: {
          limit: Infinity,
          remaining: Infinity,
          resetTime: Date.now()
        }
      }
    }

    return limiter.checkRequest()
  }

  /**
   * Attend que la limite soit respectée pour un provider
   */
  async waitForAvailability(providerName: string): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    // Attendre la disponibilité globale
    if (this.globalLimiter) {
      await this.globalLimiter.waitForAvailability()
    }

    // Attendre la disponibilité du provider
    const limiter = this.limiters.get(providerName)
    if (limiter) {
      await limiter.waitForAvailability()
    }
  }

  /**
   * Obtient les informations de rate limiting pour un provider
   */
  getInfo(providerName: string): RateLimitInfo {
    const limiter = this.limiters.get(providerName)
    if (!limiter) {
      return {
        limit: Infinity,
        remaining: Infinity,
        resetTime: Date.now()
      }
    }

    return limiter.getInfo()
  }

  /**
   * Obtient les informations de rate limiting global
   */
  getGlobalInfo(): RateLimitInfo | null {
    if (!this.globalLimiter) {
      return null
    }

    return this.globalLimiter.getInfo()
  }

  /**
   * Obtient les informations pour tous les providers
   */
  getAllInfo(): Record<string, RateLimitInfo> {
    const info: Record<string, RateLimitInfo> = {}
    
    for (const [providerName, limiter] of this.limiters) {
      info[providerName] = limiter.getInfo()
    }
    
    if (this.globalLimiter) {
      info.global = this.globalLimiter.getInfo()
    }
    
    return info
  }

  /**
   * Vérifie si le service est en bonne santé
   */
  isHealthy(): boolean {
    return this.config.enabled
  }

  /**
   * Méthodes utilitaires pour les providers spécifiques
   */

  // Scryfall: 30 requêtes/minute
  checkScryfallRequest(): RateLimitResult {
    return this.checkRequest('scryfall')
  }

  async waitForScryfallAvailability(): Promise<void> {
    await this.waitForAvailability('scryfall')
  }

  // MTGGoldfish: 100 requêtes/minute
  checkMTGGoldfishRequest(): RateLimitResult {
    return this.checkRequest('mtggoldfish')
  }

  async waitForMTGGoldfishAvailability(): Promise<void> {
    await this.waitForAvailability('mtggoldfish')
  }

  // TCGPlayer: 50 requêtes/minute
  checkTCGPlayerRequest(): RateLimitResult {
    return this.checkRequest('tcgplayer')
  }

  async waitForTCGPlayerAvailability(): Promise<void> {
    await this.waitForAvailability('tcgplayer')
  }
}

/**
 * Configuration par défaut pour le rate limiting
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  enabled: true,
  providers: {
    scryfall: {
      requests: 30,
      per: 'minute',
      burst: 5
    },
    mtggoldfish: {
      requests: 100,
      per: 'minute',
      burst: 10
    },
    tcgplayer: {
      requests: 50,
      per: 'minute',
      burst: 5
    }
  },
  global: {
    requests: 200,
    per: 'minute'
  }
}
