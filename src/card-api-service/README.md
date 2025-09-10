# Card API Service

Service unifié pour gérer les APIs tierces de cartes avec support multi-providers, cache, rate limiting et fallback automatique.

## 🏗️ Architecture

```
card-api-service/
├── providers/          # Implémentations des APIs externes
│   └── ScryfallProvider.ts
├── adapters/           # Transformateurs de format API → app
│   └── ScryfallAdapter.ts
├── interfaces/         # Contrats d'API
│   ├── ICardProvider.ts
│   ├── ISetProvider.ts
│   ├── IPricingProvider.ts
│   └── ICardAdapter.ts
├── dto/               # Data Transfer Objects
│   ├── RequestDTOs.ts
│   ├── ResponseDTOs.ts
│   ├── AppDTOs.ts
│   └── ApiDTOs.ts
├── config/            # Configuration et types
│   ├── ServiceConfig.ts
│   └── EnvironmentConfig.ts
├── factory/           # Factory patterns
│   └── CardServiceFactory.ts
├── examples/          # Exemples d'utilisation
│   └── usage-example.ts
└── index.ts          # Point d'entrée principal
```

## 🎯 Design Patterns Utilisés

- **Adapter Pattern** : Transformation des formats API
- **Strategy Pattern** : Sélection dynamique de provider
- **Factory Pattern** : Création des services
- **Facade Pattern** : Interface unifiée
- **Observer Pattern** : Monitoring et cache

## 🚀 Providers Supportés

- ✅ **Scryfall** (implémenté) - Magic: The Gathering
- 🔄 **MTGGoldfish** (en cours) - Prix et données MTG
- 🔄 **TCGPlayer** (planifié) - Marketplace et prix
- 🔄 **Pokemon TCG API** (planifié) - Cartes Pokemon

## 📋 Fonctionnalités

### Actions API Supportées
- ✅ `fetchCard` - Récupération unitaire d'une carte
- ✅ `fetchCardByName` - Récupération par nom
- ✅ `searchCards` - Recherche de cartes
- ✅ `fetchSetCards` - Cartes d'un set
- ✅ `fetchMoreCards` - Pagination automatique
- ✅ `fetchSets` - Liste des sets
- ✅ `fetchCardPrice` - Prix d'une carte

### Fonctionnalités Avancées
- 🔄 **Cache intelligent** avec TTL configurable
- 🔄 **Rate limiting** respectueux des APIs
- 🔄 **Fallback automatique** entre providers
- 🔄 **Gestion d'erreurs** robuste
- 🔄 **Monitoring** et métriques
- 🔄 **Configuration** flexible

## 🛠️ Utilisation

### Installation

```typescript
import { CardServiceFactory, ScryfallProvider, ScryfallAdapter } from '@/card-api-service'
```

### Utilisation Basique

```typescript
// Création du service avec configuration par défaut
const cardService = CardServiceFactory.create()

// Récupération d'une carte
const card = await cardService.fetchCard({
  cardId: '9ea8179a-d3c9-4cdc-a5b5-68cc73279050'
})
```

### Utilisation Directe du Provider

```typescript
const provider = new ScryfallProvider()
const adapter = new ScryfallAdapter()

// Récupération des données brutes
const response = await provider.fetchCard({
  cardId: '9ea8179a-d3c9-4cdc-a5b5-68cc73279050'
})

// Transformation vers le format app
const card = adapter.transformCard(response.data)
```

### Configuration Personnalisée

```typescript
const customConfig = {
  defaultProvider: 'scryfall',
  cache: {
    enabled: true,
    ttl: 7200, // 2 heures
    provider: 'memory'
  },
  providers: {
    scryfall: {
      rateLimit: {
        requests: 30,
        per: 'minute'
      },
      timeout: 15000
    }
  }
}

const cardService = CardServiceFactory.create(customConfig)
```

## 🔧 Configuration

### Variables d'Environnement

```env
CARD_API_CACHE_ENABLED=true
CARD_API_CACHE_TTL=3600
CARD_API_DEFAULT_PROVIDER=scryfall
CARD_API_SCRYFALL_ENABLED=true
CARD_API_MTGGOLDFISH_ENABLED=false
CARD_API_TCGPLAYER_ENABLED=false
CARD_API_MONITORING_ENABLED=true
CARD_API_LOG_LEVEL=info
```

### Configuration Programmatique

```typescript
import { DEFAULT_SERVICE_CONFIG } from '@/card-api-service'

const config = {
  ...DEFAULT_SERVICE_CONFIG,
  cache: {
    ...DEFAULT_SERVICE_CONFIG.cache,
    ttl: 7200
  }
}
```

## 📊 DTOs et Types

### DTOs de Requête
- `CardFetchRequestDTO` - Récupération de carte
- `SetFetchRequestDTO` - Récupération de set
- `SearchRequestDTO` - Recherche
- `BulkFetchRequestDTO` - Récupération en lot

### DTOs de Réponse
- `CardServiceResponseDTO` - Réponse de carte
- `SetServiceResponseDTO` - Réponse de set
- `PriceServiceResponseDTO` - Réponse de prix
- `BulkCardResponseDTO` - Réponse en lot

### DTOs d'Application
- `GameSet` - Format unifié de set
- `PriceData` - Format unifié de prix
- `CardSearchResult` - Résultat de recherche

## 🧪 Tests

```typescript
// Exemples de tests dans examples/usage-example.ts
import { runAllExamples } from '@/card-api-service/examples/usage-example'

// Exécuter tous les exemples
await runAllExamples()
```

## 🔄 Migration depuis l'Ancien Code

### Avant (Code Actuel)
```typescript
// Ancien code Scryfall
const response = await fetch(`https://api.scryfall.com/cards/${cardId}`)
const rawCard = await response.json()
const formattedCard = formatCard(rawCard)
```

### Après (Nouveau Service)
```typescript
// Nouveau service unifié
const cardService = CardServiceFactory.create()
const card = await cardService.fetchCard({ cardId })
```

## 🚧 Roadmap

### Phase 1: Base (✅ Terminé)
- [x] Interfaces et DTOs
- [x] Provider Scryfall
- [x] Adapter Scryfall
- [x] Factory de base

### Phase 2: Services (🔄 En cours)
- [ ] CardService principal
- [ ] SetService
- [ ] PricingService
- [ ] Cache Service
- [ ] Rate Limiting Service

### Phase 3: Providers Additionnels (📋 Planifié)
- [ ] MTGGoldfish Provider
- [ ] TCGPlayer Provider
- [ ] Pokemon TCG Provider

### Phase 4: Optimisations (📋 Planifié)
- [ ] Cache Redis
- [ ] Monitoring avancé
- [ ] Circuit Breaker
- [ ] Métriques et alertes

## 🤝 Contribution

1. Créer un nouveau provider dans `providers/`
2. Créer l'adapter correspondant dans `adapters/`
3. Ajouter les DTOs nécessaires dans `dto/ApiDTOs.ts`
4. Mettre à jour la factory dans `factory/CardServiceFactory.ts`
5. Ajouter des tests dans `examples/`

## 📝 Notes

- Tous les providers respectent les interfaces définies
- Les adapters transforment les données vers le format unifié
- La factory gère la création et la configuration
- Les DTOs assurent la cohérence des données
- La configuration est flexible et extensible