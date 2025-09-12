/**
 * Configuration du service Card API
 */

export interface ProviderConfig {
  name: string
  baseUrl: string
  apiKey?: string
  rateLimit: {
    requests: number
    per: 'second' | 'minute' | 'hour'
  }
  timeout: number
  retryAttempts: number
  enabled: boolean
  priority: number // 1 = highest priority
  fallbackEnabled: boolean
}

export interface CacheConfig {
  enabled: boolean
  ttl: number // Time to live in seconds
  maxSize: number // Maximum number of entries
  provider: 'memory' | 'redis' | 'file'
  redis?: {
    host: string
    port: number
    password?: string
    db?: number
  }
}

export interface MonitoringConfig {
  enabled: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  metricsEnabled: boolean
  alerting?: {
    enabled: boolean
    webhook?: string
    email?: string
  }
}

export interface ServiceConfig {
  defaultProvider: string
  fallbackProviders: string[]
  cache: CacheConfig
  providers: Record<string, ProviderConfig>
  monitoring: MonitoringConfig
  global: {
    timeout: number
    retryAttempts: number
    circuitBreaker?: {
      enabled: boolean
      failureThreshold: number
      recoveryTimeout: number
    }
  }
}

// Configuration par défaut
export const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  defaultProvider: 'scryfall',
  fallbackProviders: ['mtggoldfish', 'tcgplayer'],
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 10000,
    provider: 'memory'
  },
  providers: {
    scryfall: {
      name: 'scryfall',
      baseUrl: 'https://api.scryfall.com',
      rateLimit: {
        requests: 50,
        per: 'minute'
      },
      timeout: 10000,
      retryAttempts: 3,
      enabled: true,
      priority: 1,
      fallbackEnabled: true
    },
    mtggoldfish: {
      name: 'mtggoldfish',
      baseUrl: 'https://www.mtggoldfish.com/api',
      rateLimit: {
        requests: 100,
        per: 'minute'
      },
      timeout: 15000,
      retryAttempts: 2,
      enabled: false, // Disabled by default
      priority: 2,
      fallbackEnabled: true
    },
    tcgplayer: {
      name: 'tcgplayer',
      baseUrl: 'https://api.tcgplayer.com',
      rateLimit: {
        requests: 200,
        per: 'minute'
      },
      timeout: 12000,
      retryAttempts: 2,
      enabled: false, // Disabled by default
      priority: 3,
      fallbackEnabled: true
    }
  },
  monitoring: {
    enabled: true,
    logLevel: 'info',
    metricsEnabled: true
  },
  global: {
    timeout: 30000,
    retryAttempts: 3,
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      recoveryTimeout: 60000
    }
  }
}
