import type { CardFetchRequestDTO, SetFetchRequestDTO } from '../dto'
import type { CardServiceResponseDTO, SetServiceResponseDTO, SetsServiceResponseDTO, AutocompleteResponseDTO } from '../dto'

/**
 * Interface pour les providers de cartes
 * Définit le contrat que doivent respecter tous les providers d'API de cartes
 */
export interface ICardProvider {
  /**
   * Nom unique du provider (ex: 'scryfall', 'mtggoldfish')
   */
  readonly name: string

  /**
   * URL de base de l'API
   */
  readonly baseUrl: string

  /**
   * Récupère une carte par son ID
   */
  fetchCard(request: CardFetchRequestDTO): Promise<CardServiceResponseDTO>

  /**
   * Récupère une carte par son nom
   */
  fetchCardByName(cardName: string, options?: any): Promise<CardServiceResponseDTO>

  /**
   * Recherche des cartes avec une requête
   */
  searchCards(query: string, options?: any): Promise<CardServiceResponseDTO[]>

  /**
   * Récupère toutes les cartes d'un set
   */
  fetchSetCards(request: SetFetchRequestDTO): Promise<SetServiceResponseDTO>

  /**
   * Récupère la suite des cartes (pagination)
   */
  fetchMoreCards(nextPageUrl: string): Promise<SetServiceResponseDTO>

  /**
   * Récupère tous les sets disponibles
   */
  fetchSets(): Promise<SetsServiceResponseDTO>

  /**
   * Vérifie si le provider est disponible
   */
  isHealthy(): Promise<boolean>

  /**
   * Récupère les informations de rate limiting
   */
  getRateLimitInfo(): Promise<RateLimitInfo>

  /**
   * Récupère les suggestions d'autocomplete pour une requête
   */
  fetchAutocomplete(query: string): Promise<AutocompleteResponseDTO>
}

export interface RateLimitInfo {
  remaining: number
  resetTime: number
  limit: number
}
