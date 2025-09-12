/**
 * Point d'entrée principal du service Card API
 */

// Interfaces
export type {
  ICardProvider,
  ISetProvider,
  IPricingProvider,
  ICardAdapter,
  RateLimitInfo
} from './interfaces'

// DTOs
export type {
  CardFetchRequestDTO,
  SetFetchRequestDTO,
  SearchRequestDTO,
  BulkFetchRequestDTO,
  FetchOptionsDTO,
  SetFetchOptionsDTO,
  SearchOptionsDTO,
  BulkFetchOptionsDTO,
  CardServiceResponseDTO,
  SetServiceResponseDTO,
  PriceServiceResponseDTO,
  BulkCardResponseDTO,
  AutocompleteResponseDTO,
  ServiceMetadataDTO,
  BulkServiceMetadataDTO,
  ServiceErrorDTO,
  RateLimitInfoDTO,
  GameSet,
  PriceData,
  CardSearchResult,
  SearchFilters,
  ScryfallCardDTO,
  ScryfallCardFaceDTO,
  ScryfallSetDTO,
  ScryfallSearchResultDTO,
  ScryfallAutocompleteDTO,
  MTGGoldfishCardDTO,
  MTGGoldfishSetDTO,
  TCGPlayerCardDTO,
  TCGPlayerSetDTO
} from './dto'

// Configuration
export type {
  ProviderConfig,
  CacheConfig,
  MonitoringConfig,
  ServiceConfig,
  EnvironmentConfig
} from './config'

export {
  DEFAULT_SERVICE_CONFIG,
  getEnvironmentConfig
} from './config'

// Providers
export { ScryfallProvider } from './providers/ScryfallProvider'
export { ScryfallPricingProvider } from './providers/ScryfallPricingProvider'

// Adapters
export { ScryfallAdapter } from './adapters/ScryfallAdapter'

// Factory
export { CardServiceFactory } from './factory/CardServiceFactory'

// Services principaux
export { CardService } from './services/CardService'
export { SetService } from './services/SetService'
export { PricingService } from './services/PricingService'

// Infrastructure
export {
  CacheService,
  MemoryCacheProvider,
  RedisCacheProvider,
  RateLimitService,
  MonitoringService,
  type RateLimitConfig,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_MONITORING_CONFIG
} from './infrastructure'

// Stratégies
export {
  ProviderSelectionStrategyFactory,
  FallbackService,
  type IProviderSelectionStrategy,
  type IFallbackStrategy,
  type FallbackConfig,
  DEFAULT_FALLBACK_CONFIG
} from './strategy'
