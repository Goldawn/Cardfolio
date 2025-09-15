import type { GameCard } from '@/types/utils/guards'
import type { GameSet, PriceData } from '../dto/AppDTOs'

/**
 * DTOs pour les réponses des services
 */

export interface CardServiceResponseDTO {
  data: GameCard
  metadata: ServiceMetadataDTO
  error?: ServiceErrorDTO
}

export interface SetServiceResponseDTO {
  data: GameSet | GameSet[]
  metadata: ServiceMetadataDTO
  error?: ServiceErrorDTO
}

export interface SetsServiceResponseDTO {
  data: GameSet[]
  metadata: ServiceMetadataDTO
  error?: ServiceErrorDTO
}

export interface PriceServiceResponseDTO {
  data: PriceData
  metadata: ServiceMetadataDTO
  error?: ServiceErrorDTO
}

export interface BulkCardResponseDTO {
  cards: GameCard[]
  errors: Array<{
    cardId: string
    error: ServiceErrorDTO
  }>
  metadata: BulkServiceMetadataDTO
}

export interface AutocompleteResponseDTO {
  data: string[]
  metadata: ServiceMetadataDTO
  error?: ServiceErrorDTO
}

export interface ServiceMetadataDTO {
  provider: string
  cached: boolean
  fetchTime: number
  timestamp: string
  rateLimitInfo?: RateLimitInfoDTO
  requestId?: string
}

export interface BulkServiceMetadataDTO extends ServiceMetadataDTO {
  totalRequested: number
  totalSuccessful: number
  totalFailed: number
  providers: string[]
  batchInfo?: {
    totalBatches: number
    completedBatches: number
  }
}

export interface ServiceErrorDTO {
  code: string
  message: string
  provider: string
  retryable: boolean
  fallbackAttempted?: boolean
  originalError?: any
  timestamp: string
}

export interface RateLimitInfoDTO {
  remaining: number
  resetTime: number
  limit: number
  retryAfter?: number
}
