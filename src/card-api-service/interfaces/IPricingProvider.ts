import type { PriceServiceResponseDTO } from '../dto/ResponseDTOs'

/**
 * Interface pour les providers de prix
 * Définit le contrat pour récupérer les informations de prix
 */
export interface IPricingProvider {
  /**
   * Nom unique du provider
   */
  readonly name: string

  /**
   * Récupère le prix d'une carte par son ID
   */
  fetchCardPrice(cardId: string): Promise<PriceServiceResponseDTO>

  /**
   * Récupère le prix d'une carte par son nom
   */
  fetchCardPriceByName(cardName: string, setCode?: string): Promise<PriceServiceResponseDTO>

  /**
   * Récupère les prix de plusieurs cartes en une fois
   */
  fetchBulkPrices(cardIds: string[]): Promise<PriceServiceResponseDTO[]>

  /**
   * Récupère l'historique des prix d'une carte
   */
  fetchPriceHistory(cardId: string, period?: string): Promise<PriceServiceResponseDTO>

  /**
   * Vérifie si le provider est disponible
   */
  isHealthy(): Promise<boolean>
}
