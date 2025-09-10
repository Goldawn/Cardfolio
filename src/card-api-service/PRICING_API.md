# API des Prix - Card API Service

## 🎯 Vue d'ensemble

Le module `card-api-service` inclut maintenant une API complète pour la gestion des prix des cartes Magic: The Gathering. Cette implémentation remplace l'ancienne approche directe avec l'API Scryfall et offre une architecture extensible pour supporter plusieurs providers de prix.

## 🏗️ Architecture

```
PricingService
├── ScryfallPricingProvider (implémenté)
├── MTGGoldfishProvider (planifié)
├── TCGPlayerProvider (planifié)
└── Fallback automatique entre providers
```

## 🚀 Utilisation

### Import du Service

```typescript
import { CardServiceFactory, PricingService } from '@/card-api-service'
```

### Création du Service

```typescript
// Création simple
const pricingService = CardServiceFactory.createPricingService()

// Création avec configuration personnalisée
const pricingService = CardServiceFactory.createPricingService({
  defaultProvider: 'scryfall-pricing',
  providers: {
    scryfall: { enabled: true }
  }
})

// Création de tous les services (Card + Pricing)
const { cardService, pricingService } = CardServiceFactory.createAllServices()
```

### Méthodes Principales

#### 1. Prix par Nom de Carte

```typescript
// Format simple (compatible avec l'ancienne API)
const simplePrice = await pricingService.fetchSimplePrice('Lightning Bolt')
// Retourne: { usd: 0.25, eur: 0.20 }

// Format détaillé
const detailedPrice = await pricingService.fetchCardPriceByName('Lightning Bolt')
// Retourne: PriceData avec toutes les informations
```

#### 2. Prix par ID de Carte

```typescript
// Format simple
const simplePrice = await pricingService.fetchSimplePriceById('9ea8179a-d3c9-4cdc-a5b5-68cc73279050')
// Retourne: { usd: 0.25, eur: 0.20 }

// Format détaillé
const detailedPrice = await pricingService.fetchCardPrice('9ea8179a-d3c9-4cdc-a5b5-68cc73279050')
// Retourne: PriceData avec toutes les informations
```

#### 3. Prix en Lot

```typescript
const cardIds = [
  '9ea8179a-d3c9-4cdc-a5b5-68cc73279050', // Lightning Bolt
  'a3fb7228-e76b-4e96-a40e-20b5fed75685', // Counterspell
]

const prices = await pricingService.fetchBulkPrices(cardIds)
// Retourne: PriceData[] avec les prix de toutes les cartes
```

#### 4. Fallback Automatique

```typescript
// Utilise automatiquement le fallback si le provider principal échoue
const price = await pricingService.fetchCardPriceByNameWithFallback('Lightning Bolt')
const priceById = await pricingService.fetchCardPriceWithFallback('9ea8179a-d3c9-4cdc-a5b5-68cc73279050')
```

### Gestion des Providers

```typescript
// Vérifier la santé des providers
const healthStatus = await pricingService.checkProvidersHealth()
// Retourne: { 'scryfall-pricing': true }

// Obtenir la liste des providers disponibles
const providers = pricingService.getAvailableProviders()
// Retourne: ['scryfall-pricing']

// Obtenir le provider par défaut
const defaultProvider = pricingService.getDefaultProvider()
// Retourne: 'scryfall-pricing'
```

## 🔄 Migration depuis l'Ancienne API

### Avant (Ancienne Implémentation)

```typescript
import { fetchCardPrice } from '@/app/services/pricing'

const price = await fetchCardPrice('Lightning Bolt')
// Retourne: { usd: 0.25, eur: 0.20 }
```

### Après (Nouvelle API)

```typescript
// Option 1: Utiliser le service de pricing existant (recommandé)
import { fetchCardPrice } from '@/app/services/pricing'

const price = await fetchCardPrice('Lightning Bolt')
// Même interface, mais utilise maintenant le nouveau PricingService en arrière-plan

// Option 2: Utiliser directement le PricingService
import { CardServiceFactory } from '@/card-api-service'

const pricingService = CardServiceFactory.createPricingService()
const price = await pricingService.fetchSimplePrice('Lightning Bolt')
```

## 📊 Types de Données

### PriceData

```typescript
interface PriceData {
  cardId: string
  cardName: string
  setCode?: string
  prices: {
    usd?: number
    eur?: number
    tix?: number
  }
  lastUpdated: string
  source: string
  marketPrice?: {
    usd?: number
    eur?: number
  }
  foilPrice?: {
    usd?: number
    eur?: number
  }
}
```

### Format Simple (Compatibilité)

```typescript
interface SimplePrice {
  usd: number
  eur: number
}
```

## 🛠️ Configuration

### Variables d'Environnement

```env
CARD_API_DEFAULT_PROVIDER=scryfall-pricing
CARD_API_SCRYFALL_ENABLED=true
CARD_API_CACHE_ENABLED=true
CARD_API_CACHE_TTL=3600
```

### Configuration Programmatique

```typescript
const config = {
  defaultProvider: 'scryfall-pricing',
  providers: {
    scryfall: {
      enabled: true,
      rateLimit: {
        requests: 30,
        per: 'minute'
      },
      timeout: 15000
    }
  },
  cache: {
    enabled: true,
    ttl: 3600
  }
}

const pricingService = CardServiceFactory.createPricingService(config)
```

## 🧪 Tests et Exemples

### Exécuter les Tests

```typescript
import { runAllPricingExamples } from '@/card-api-service/examples/pricing-example'

// Exécuter tous les exemples
await runAllPricingExamples()
```

### Test Simple

```typescript
import { testPricingService } from '@/card-api-service/test-pricing'

// Exécuter le test de base
await testPricingService()
```

## 🔮 Roadmap

### Phase 1: Base (✅ Terminé)
- [x] ScryfallPricingProvider
- [x] PricingService principal
- [x] Intégration avec CardServiceFactory
- [x] Compatibilité avec l'ancienne API

### Phase 2: Providers Additionnels (📋 Planifié)
- [ ] MTGGoldfishProvider
- [ ] TCGPlayerProvider
- [ ] Comparaison de prix entre providers

### Phase 3: Fonctionnalités Avancées (📋 Planifié)
- [ ] Cache des prix
- [ ] Historique des prix
- [ ] Alertes de prix
- [ ] Métriques et monitoring

## 🚨 Gestion d'Erreurs

Le service gère automatiquement les erreurs et fournit des fallbacks :

```typescript
try {
  const price = await pricingService.fetchSimplePrice('Lightning Bolt')
  if (price.usd === 0 && price.eur === 0) {
    console.warn('Aucun prix trouvé pour cette carte')
  }
} catch (error) {
  console.error('Erreur lors de la récupération du prix:', error)
}
```

## 📝 Notes Importantes

1. **Compatibilité**: L'ancienne API `fetchCardPrice()` continue de fonctionner sans modification
2. **Performance**: Le nouveau service utilise des requêtes optimisées et un fallback automatique
3. **Extensibilité**: Facile d'ajouter de nouveaux providers de prix
4. **Type Safety**: Tous les types sont définis et validés avec TypeScript
5. **Cache**: Le cache sera implémenté dans la phase 3 pour améliorer les performances

## 🤝 Contribution

Pour ajouter un nouveau provider de prix :

1. Créer une classe qui implémente `IPricingProvider`
2. Ajouter les DTOs nécessaires dans `dto/ApiDTOs.ts`
3. Mettre à jour `PricingService` pour inclure le nouveau provider
4. Ajouter des tests dans `examples/pricing-example.ts`
