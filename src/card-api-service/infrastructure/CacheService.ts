/**
 * Service de cache pour le Card API Service
 * Supporte le cache en mémoire et Redis
 */

export interface CacheConfig {
  enabled: boolean
  ttl: number // Time to live en secondes
  provider: 'memory' | 'redis'
  redis?: {
    host: string
    port: number
    password?: string
    db?: number
  }
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

/**
 * Interface pour les implémentations de cache
 */
export interface ICacheProvider {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  isHealthy(): Promise<boolean>
}

/**
 * Implémentation de cache en mémoire
 */
export class MemoryCacheProvider implements ICacheProvider {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Nettoyage automatique toutes les 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000
    )
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Vérifier si l'entrée a expiré
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
    }

    this.cache.set(key, entry)
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async isHealthy(): Promise<boolean> {
    return true
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

/**
 * Implémentation de cache Redis (placeholder)
 */
export class RedisCacheProvider implements ICacheProvider {
  private _redis: any // Redis client
  private _config: CacheConfig['redis']

  constructor(config: CacheConfig['redis']) {
    this._config = config
    // TODO: Initialiser le client Redis
    // this._redis = new Redis(config)
  }

  async get<T>(_key: string): Promise<T | null> {
    try {
      // TODO: Implémenter la récupération Redis
      // const data = await this._redis.get(key)
      // return data ? JSON.parse(data) : null
      return null
    } catch (error) {
      console.error('Erreur Redis get:', error)
      return null
    }
  }

  async set<T>(_key: string, _value: T, _ttl: number = 3600): Promise<void> {
    try {
      // TODO: Implémenter la sauvegarde Redis
      // await this._redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Erreur Redis set:', error)
    }
  }

  async delete(_key: string): Promise<void> {
    try {
      // TODO: Implémenter la suppression Redis
      // await this._redis.del(key)
    } catch (error) {
      console.error('Erreur Redis delete:', error)
    }
  }

  async clear(): Promise<void> {
    try {
      // TODO: Implémenter le nettoyage Redis
      // await this.redis.flushdb()
    } catch (error) {
      console.error('Erreur Redis clear:', error)
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      // TODO: Vérifier la santé de Redis
      // await this.redis.ping()
      return true
    } catch (_error) {
      return false
    }
  }
}

/**
 * Service de cache principal
 */
export class CacheService {
  private provider: ICacheProvider
  private config: CacheConfig
  private keyPrefix: string

  constructor(config: CacheConfig) {
    this.config = config
    this.keyPrefix = 'card-api:'

    // Initialiser le provider
    if (config.provider === 'redis' && config.redis) {
      this.provider = new RedisCacheProvider(config.redis)
    } else {
      this.provider = new MemoryCacheProvider()
    }
  }

  /**
   * Génère une clé de cache
   */
  private generateKey(prefix: string, ...parts: string[]): string {
    return `${this.keyPrefix}${prefix}:${parts.join(':')}`
  }

  /**
   * Récupère une valeur du cache
   */
  async get<T>(prefix: string, ...keyParts: string[]): Promise<T | null> {
    if (!this.config.enabled) {
      return null
    }

    const key = this.generateKey(prefix, ...keyParts)
    return await this.provider.get<T>(key)
  }

  /**
   * Stocke une valeur dans le cache
   */
  async set<T>(
    prefix: string,
    value: T,
    ttl?: number,
    ...keyParts: string[]
  ): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    const key = this.generateKey(prefix, ...keyParts)
    const finalTtl = ttl || this.config.ttl
    await this.provider.set(key, value, finalTtl)
  }

  /**
   * Supprime une valeur du cache
   */
  async delete(prefix: string, ...keyParts: string[]): Promise<void> {
    if (!this.config.enabled) {
      return
    }

    const key = this.generateKey(prefix, ...keyParts)
    await this.provider.delete(key)
  }

  /**
   * Vide tout le cache
   */
  async clear(): Promise<void> {
    await this.provider.clear()
  }

  /**
   * Vérifie la santé du cache
   */
  async isHealthy(): Promise<boolean> {
    return await this.provider.isHealthy()
  }

  /**
   * Méthodes spécialisées pour les différents types de données
   */

  // Cache pour les cartes
  async getCard(cardId: string): Promise<any | null> {
    return await this.get('card', cardId)
  }

  async setCard(cardId: string, card: any, ttl?: number): Promise<void> {
    await this.set('card', card, ttl, cardId)
  }

  // Cache pour les sets
  async getSets(): Promise<any[] | null> {
    return await this.get('sets', 'all')
  }

  async setSets(sets: any[], ttl?: number): Promise<void> {
    await this.set('sets', sets, ttl, 'all')
  }

  // Cache pour les prix
  async getPrice(cardId: string): Promise<any | null> {
    return await this.get('price', cardId)
  }

  async setPrice(cardId: string, price: any, ttl?: number): Promise<void> {
    await this.set('price', price, ttl, cardId)
  }

  // Cache pour les recherches
  async getSearchResults(query: string, filters?: any): Promise<any[] | null> {
    const filterKey = filters ? JSON.stringify(filters) : 'no-filters'
    return await this.get('search', query, filterKey)
  }

  async setSearchResults(
    query: string,
    results: any[],
    ttl?: number,
    filters?: any
  ): Promise<void> {
    const filterKey = filters ? JSON.stringify(filters) : 'no-filters'
    await this.set('search', results, ttl, query, filterKey)
  }

  /**
   * Invalide le cache pour un type de données
   */
  async invalidateCard(cardId: string): Promise<void> {
    await this.delete('card', cardId)
    await this.delete('price', cardId)
  }

  async invalidateSets(): Promise<void> {
    await this.delete('sets', 'all')
  }

  async invalidateSearch(query: string, filters?: any): Promise<void> {
    const filterKey = filters ? JSON.stringify(filters) : 'no-filters'
    await this.delete('search', query, filterKey)
  }
}
