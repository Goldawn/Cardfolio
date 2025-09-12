/**
 * Point d'entrée principal du service Card API
 */

// Interfaces
export type {
  ICardAdapter,
  ICardProvider,
  IPricingProvider,
  ISetProvider,
  RateLimitInfo,
} from './interfaces'

// DTOs
export type {
  AutocompleteResponseDTO,
  BulkCardResponseDTO,
  BulkFetchOptionsDTO,
  BulkFetchRequestDTO,
  BulkServiceMetadataDTO,
  CardFetchRequestDTO,
  CardSearchResult,
  CardServiceResponseDTO,
  FetchOptionsDTO,
  GameSet,
  MTGGoldfishCardDTO,
  MTGGoldfishSetDTO,
  PriceData,
  PriceServiceResponseDTO,
  RateLimitInfoDTO,
  ScryfallAutocompleteDTO,
  ScryfallCardDTO,
  ScryfallCardFaceDTO,
  ScryfallSearchResultDTO,
  ScryfallSetDTO,
  SearchFilters,
  SearchOptionsDTO,
  SearchRequestDTO,
  ServiceErrorDTO,
  ServiceMetadataDTO,
  SetFetchOptionsDTO,
  SetFetchRequestDTO,
  SetServiceResponseDTO,
  TCGPlayerCardDTO,
  TCGPlayerSetDTO,
} from './dto'

// Configuration
export type {
  CacheConfig,
  EnvironmentConfig,
  MonitoringConfig,
  ProviderConfig,
  ServiceConfig,
} from './config'

export { DEFAULT_SERVICE_CONFIG, getEnvironmentConfig } from './config'

// Providers
export { ScryfallPricingProvider } from './providers/ScryfallPricingProvider'
export { ScryfallProvider } from './providers/ScryfallProvider'

// Adapters
export { DatabaseAdapter } from './adapters/DatabaseAdapter'
export { ScryfallAdapter } from './adapters/ScryfallAdapter'

// Factory
export { CardServiceFactory } from './factory/CardServiceFactory'

// Services principaux
export { CardImportService } from './services/CardImportService'
export { CardService } from './services/CardService'
export { PricingService } from './services/PricingService'
export { SetService } from './services/SetService'

// Infrastructure
export {
  CacheService,
  DEFAULT_MONITORING_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  MemoryCacheProvider,
  MonitoringService,
  RateLimitService,
  RedisCacheProvider,
  type RateLimitConfig,
} from './infrastructure'

// Stratégies
export {
  DEFAULT_FALLBACK_CONFIG,
  FallbackService,
  ProviderSelectionStrategyFactory,
  type FallbackConfig,
  type IFallbackStrategy,
  type IProviderSelectionStrategy,
} from './strategy'
