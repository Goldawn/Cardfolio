import axios, { type AxiosResponse } from 'axios'
import type { ICardProvider, RateLimitInfo } from '../interfaces'
import type { 
  CardFetchRequestDTO, 
  SetFetchRequestDTO,
  CardServiceResponseDTO,
  SetServiceResponseDTO,
  SetsServiceResponseDTO,
  ServiceErrorDTO,
  ServiceMetadataDTO,
  ScryfallCardDTO, 
  ScryfallSetDTO, 
  ScryfallSearchResultDTO
} from '../dto'

/**
 * Provider Scryfall pour les cartes Magic: The Gathering
 */
export class ScryfallProvider implements ICardProvider {
  readonly name = 'scryfall'
  readonly baseUrl = 'https://api.scryfall.com'

  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.get(`${this.baseUrl}${endpoint}`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error: any) {
      throw new Error(`Scryfall API error: ${error.message}`)
    }
  }

  async fetchCard(request: CardFetchRequestDTO): Promise<CardServiceResponseDTO> {
    const startTime = Date.now()
    
    try {
      let endpoint: string
      
      if (request.cardId) {
        endpoint = `/cards/${request.cardId}`
      } else if (request.cardName) {
        endpoint = `/cards/named?exact=${encodeURIComponent(request.cardName)}`
      } else {
        throw new Error('Either cardId or cardName must be provided')
      }

      const rawCard = await this.makeRequest<ScryfallCardDTO>(endpoint)
      
      return {
        data: rawCard as any, // Will be transformed by adapter
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      return {
        data: {} as any,
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        },
        error: {
          code: 'SCRYFALL_FETCH_ERROR',
          message: error.message,
          provider: this.name,
          retryable: true,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  async fetchCardByName(cardName: string, options?: any): Promise<CardServiceResponseDTO> {
    return this.fetchCard({ cardName, options })
  }

  async searchCards(query: string, options?: any): Promise<CardServiceResponseDTO[]> {
    const startTime = Date.now()
    
    try {
      const searchParams = new URLSearchParams({
        q: query,
        ...options
      })
      
      const result = await this.makeRequest<ScryfallSearchResultDTO>(`/cards/search?${searchParams}`)
      
      return result.data.map(card => ({
        data: card as any,
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error: any) {
      return [{
        data: {} as any,
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        },
        error: {
          code: 'SCRYFALL_SEARCH_ERROR',
          message: error.message,
          provider: this.name,
          retryable: true,
          timestamp: new Date().toISOString()
        }
      }]
    }
  }

  async fetchSetCards(request: SetFetchRequestDTO): Promise<SetServiceResponseDTO> {
    const startTime = Date.now()
    
    try {
      const searchParams = new URLSearchParams({
        q: `set:${request.setCode}`,
        unique: 'prints'
      })
      
      if (request.language) {
        searchParams.append('lang', request.language)
      }
      
      const result = await this.makeRequest<ScryfallSearchResultDTO>(`/cards/search?${searchParams}`)
      
      return {
        data: result.data as any, // Will be transformed by adapter
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      return {
        data: [] as any,
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        },
        error: {
          code: 'SCRYFALL_SET_FETCH_ERROR',
          message: error.message,
          provider: this.name,
          retryable: true,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  async fetchMoreCards(nextPageUrl: string): Promise<SetServiceResponseDTO> {
    const startTime = Date.now()
    
    try {
      const result = await this.makeRequest<ScryfallSearchResultDTO>(nextPageUrl)
      
      return {
        data: result.data as any,
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      return {
        data: [] as any,
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        },
        error: {
          code: 'SCRYFALL_MORE_CARDS_ERROR',
          message: error.message,
          provider: this.name,
          retryable: true,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  async fetchSets(): Promise<SetsServiceResponseDTO> {
    const startTime = Date.now()
    
    try {
      const result = await this.makeRequest<{ data: ScryfallSetDTO[] }>('/sets')
      
      return {
        data: result.data as any,
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      return {
        data: [] as any,
        metadata: {
          provider: this.name,
          cached: false,
          fetchTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        },
        error: {
          code: 'SCRYFALL_SETS_ERROR',
          message: error.message,
          provider: this.name,
          retryable: true,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.makeRequest('/sets')
      return true
    } catch {
      return false
    }
  }

  async getRateLimitInfo(): Promise<RateLimitInfo> {
    // Scryfall doesn't provide rate limit headers in responses
    // This is a placeholder implementation
    return {
      remaining: 50,
      resetTime: Date.now() + 60000, // 1 minute
      limit: 50
    }
  }
}
