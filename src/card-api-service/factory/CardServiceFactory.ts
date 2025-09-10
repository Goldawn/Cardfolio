import type { ServiceConfig } from '../config'
import { DEFAULT_SERVICE_CONFIG } from '../config'
import { ScryfallProvider } from '../providers/ScryfallProvider'
import { ScryfallAdapter } from '../adapters/ScryfallAdapter'

/**
 * Factory pour créer les services Card API
 */
export class CardServiceFactory {
  /**
   * Crée une instance du service Card avec la configuration fournie
   */
  static create(config: Partial<ServiceConfig> = {}): any {
    const finalConfig = { ...DEFAULT_SERVICE_CONFIG, ...config }
    
    // Création des providers
    const providers = new Map()
    const adapters = new Map()

    // Scryfall Provider
    if (finalConfig.providers.scryfall.enabled) {
      const scryfallProvider = new ScryfallProvider()
      const scryfallAdapter = new ScryfallAdapter()
      
      providers.set('scryfall', scryfallProvider)
      adapters.set('scryfall', scryfallAdapter)
    }

    // TODO: Ajouter d'autres providers (MTGGoldfish, TCGPlayer)
    // if (finalConfig.providers.mtggoldfish.enabled) {
    //   const mtggoldfishProvider = new MTGGoldfishProvider()
    //   const mtggoldfishAdapter = new MTGGoldfishAdapter()
    //   providers.set('mtggoldfish', mtggoldfishProvider)
    //   adapters.set('mtggoldfish', mtggoldfishAdapter)
    // }

    // Création du service principal
    // TODO: Implémenter CardService
    return {
      providers,
      adapters,
      config: finalConfig
    }
  }

  /**
   * Crée une configuration basée sur l'environnement
   */
  static createFromEnvironment(): any {
    // TODO: Implémenter la création depuis les variables d'environnement
    return this.create()
  }

  /**
   * Valide la configuration
   */
  static validateConfig(config: ServiceConfig): string[] {
    const errors: string[] = []

    if (!config.defaultProvider) {
      errors.push('Default provider is required')
    }

    if (!config.providers[config.defaultProvider]) {
      errors.push(`Default provider '${config.defaultProvider}' is not configured`)
    }

    if (!config.providers[config.defaultProvider]?.enabled) {
      errors.push(`Default provider '${config.defaultProvider}' is disabled`)
    }

    // Vérifier que tous les fallback providers sont configurés
    for (const fallbackProvider of config.fallbackProviders) {
      if (!config.providers[fallbackProvider]) {
        errors.push(`Fallback provider '${fallbackProvider}' is not configured`)
      }
    }

    return errors
  }
}
