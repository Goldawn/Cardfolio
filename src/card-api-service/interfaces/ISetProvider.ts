import type { SetServiceResponseDTO } from '../dto/ResponseDTOs'

/**
 * Interface pour les providers de sets
 * Définit le contrat pour récupérer les informations sur les sets
 */
export interface ISetProvider {
  /**
   * Nom unique du provider
   */
  readonly name: string

  /**
   * Récupère tous les sets disponibles
   */
  fetchSets(): Promise<SetServiceResponseDTO>

  /**
   * Récupère un set spécifique par son code
   */
  fetchSet(setCode: string): Promise<SetServiceResponseDTO>

  /**
   * Récupère les sets par type
   */
  fetchSetsByType(setType: string): Promise<SetServiceResponseDTO>

  /**
   * Vérifie si le provider est disponible
   */
  isHealthy(): Promise<boolean>
}
