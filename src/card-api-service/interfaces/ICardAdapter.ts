import type { GameCard } from '@/types/utils/guards'
import type { GameSet, PriceData } from '../dto'

/**
 * Interface pour les adapters de transformation
 * Transforme les données brutes des APIs vers le format de l'application
 */
export interface ICardAdapter {
  /**
   * Nom du provider associé à cet adapter
   */
  readonly providerName: string

  /**
   * Transforme une carte brute en format app
   */
  transformCard(rawData: any): GameCard

  /**
   * Transforme un set brut en format app
   */
  transformSet(rawData: any): GameSet

  /**
   * Transforme des données de prix brutes en format app
   */
  transformPrice(rawData: any): PriceData

  /**
   * Transforme une liste de cartes
   */
  transformCards(rawDataList: any[]): GameCard[]

  /**
   * Transforme une liste de sets
   */
  transformSets(rawDataList: any[]): GameSet[]

  /**
   * Valide que les données brutes sont dans le bon format
   */
  validateRawData(rawData: any): boolean

  /**
   * Extrait l'ID unique de la carte depuis les données brutes
   */
  extractCardId(rawData: any): string

  /**
   * Extrait le nom de la carte depuis les données brutes
   */
  extractCardName(rawData: any): string
}
