/**
 * Configuration basée sur l'environnement
 */

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test'
  CARD_API_CACHE_ENABLED: boolean
  CARD_API_CACHE_TTL: number
  CARD_API_DEFAULT_PROVIDER: string
  CARD_API_SCRYFALL_ENABLED: boolean
  CARD_API_MTGGOLDFISH_ENABLED: boolean
  CARD_API_TCGPLAYER_ENABLED: boolean
  CARD_API_TCGPLAYER_CLIENT_ID?: string
  CARD_API_TCGPLAYER_CLIENT_SECRET?: string
  CARD_API_REDIS_URL?: string
  CARD_API_MONITORING_ENABLED: boolean
  CARD_API_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error'
}

export const getEnvironmentConfig = (): Partial<EnvironmentConfig> => {
  return {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    CARD_API_CACHE_ENABLED: process.env.CARD_API_CACHE_ENABLED === 'true',
    CARD_API_CACHE_TTL: parseInt(process.env.CARD_API_CACHE_TTL || '3600'),
    CARD_API_DEFAULT_PROVIDER: process.env.CARD_API_DEFAULT_PROVIDER || 'scryfall',
    CARD_API_SCRYFALL_ENABLED: process.env.CARD_API_SCRYFALL_ENABLED !== 'false',
    CARD_API_MTGGOLDFISH_ENABLED: process.env.CARD_API_MTGGOLDFISH_ENABLED === 'true',
    CARD_API_TCGPLAYER_ENABLED: process.env.CARD_API_TCGPLAYER_ENABLED === 'true',
    CARD_API_TCGPLAYER_CLIENT_ID: process.env.CARD_API_TCGPLAYER_CLIENT_ID,
    CARD_API_TCGPLAYER_CLIENT_SECRET: process.env.CARD_API_TCGPLAYER_CLIENT_SECRET,
    CARD_API_REDIS_URL: process.env.CARD_API_REDIS_URL,
    CARD_API_MONITORING_ENABLED: process.env.CARD_API_MONITORING_ENABLED !== 'false',
    CARD_API_LOG_LEVEL: (process.env.CARD_API_LOG_LEVEL as any) || 'info'
  }
}
