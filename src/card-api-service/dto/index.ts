/**
 * Export de tous les DTOs
 */

// Request DTOs
export type {
  CardFetchRequestDTO,
  SetFetchRequestDTO,
  SearchRequestDTO,
  BulkFetchRequestDTO,
  FetchOptionsDTO,
  SetFetchOptionsDTO,
  SearchOptionsDTO,
  BulkFetchOptionsDTO
} from './RequestDTOs'

// Response DTOs
export type {
  CardServiceResponseDTO,
  SetServiceResponseDTO,
  SetsServiceResponseDTO,
  PriceServiceResponseDTO,
  BulkCardResponseDTO,
  ServiceMetadataDTO,
  BulkServiceMetadataDTO,
  ServiceErrorDTO,
  RateLimitInfoDTO
} from './ResponseDTOs'

// App DTOs
export type {
  GameSet,
  PriceData,
  CardSearchResult,
  SearchFilters
} from './AppDTOs'

// API DTOs
export type {
  ScryfallCardDTO,
  ScryfallCardFaceDTO,
  ScryfallSetDTO,
  ScryfallSearchResultDTO,
  MTGGoldfishCardDTO,
  MTGGoldfishSetDTO,
  TCGPlayerCardDTO,
  TCGPlayerSetDTO
} from './ApiDTOs'
