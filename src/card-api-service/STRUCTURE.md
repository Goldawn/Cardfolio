# Structure du Service Card API

## 📁 Organisation des Fichiers

```
src/card-api-service/
├── 📁 adapters/                    # Transformateurs de format API → app
│   └── ScryfallAdapter.ts         # Adapter pour Scryfall
├── 📁 config/                      # Configuration et types
│   ├── ServiceConfig.ts           # Configuration principale
│   ├── EnvironmentConfig.ts       # Configuration environnement
│   └── index.ts                   # Export config
├── 📁 dto/                        # Data Transfer Objects
│   ├── RequestDTOs.ts             # DTOs de requête
│   ├── ResponseDTOs.ts            # DTOs de réponse
│   ├── AppDTOs.ts                 # DTOs format app
│   ├── ApiDTOs.ts                 # DTOs format API brute
│   └── index.ts                   # Export DTOs
├── 📁 examples/                   # Exemples d'utilisation
│   └── usage-example.ts           # Exemples complets
├── 📁 factory/                    # Factory patterns
│   └── CardServiceFactory.ts      # Factory principal
├── 📁 interfaces/                 # Contrats d'API
│   ├── ICardProvider.ts           # Interface provider cartes
│   ├── ISetProvider.ts            # Interface provider sets
│   ├── IPricingProvider.ts        # Interface provider prix
│   ├── ICardAdapter.ts            # Interface adapter
│   └── index.ts                   # Export interfaces
├── 📁 providers/                  # Implémentations APIs externes
│   └── ScryfallProvider.ts        # Provider Scryfall
├── 📁 strategy/                   # Strategy patterns (à créer)
├── 📁 services/                   # Services principaux (à créer)
├── 📁 infrastructure/             # Infrastructure (à créer)
├── index.ts                       # Point d'entrée principal
├── README.md                      # Documentation principale
└── STRUCTURE.md                   # Ce fichier
```

## 🎯 Rôles des Dossiers

### `interfaces/` - Contrats d'API
- **ICardProvider** : Contrat pour récupérer des cartes
- **ISetProvider** : Contrat pour récupérer des sets
- **IPricingProvider** : Contrat pour récupérer des prix
- **ICardAdapter** : Contrat pour transformer les données

### `dto/` - Data Transfer Objects
- **RequestDTOs** : Formats des requêtes vers les services
- **ResponseDTOs** : Formats des réponses des services
- **AppDTOs** : Formats unifiés de l'application
- **ApiDTOs** : Formats bruts des APIs externes

### `providers/` - Implémentations des APIs
- **ScryfallProvider** : Communication avec l'API Scryfall
- **MTGGoldfishProvider** : (à créer) Communication avec MTGGoldfish
- **TCGPlayerProvider** : (à créer) Communication avec TCGPlayer

### `adapters/` - Transformateurs de Format
- **ScryfallAdapter** : Transformation Scryfall → Format App
- **MTGGoldfishAdapter** : (à créer) Transformation MTGGoldfish → Format App
- **TCGPlayerAdapter** : (à créer) Transformation TCGPlayer → Format App

### `config/` - Configuration
- **ServiceConfig** : Configuration principale du service
- **EnvironmentConfig** : Configuration basée sur l'environnement

### `factory/` - Factory Patterns
- **CardServiceFactory** : Création et configuration des services

### `examples/` - Exemples d'Utilisation
- **usage-example.ts** : Exemples complets d'utilisation

## 🔄 Flux de Données

```
1. Requête → RequestDTOs
2. Factory → Création des providers/adapters
3. Provider → Communication avec API externe
4. API → Retour de données brutes (ApiDTOs)
5. Adapter → Transformation vers format app (AppDTOs)
6. Service → Retour de ResponseDTOs
7. Application → Utilisation des données
```

## 📋 Équivalents DTOs

| Type de Données | Équivalent DTO | Rôle |
|----------------|----------------|------|
| **Données brutes API** | `ScryfallCardDTO` | Format exact de l'API Scryfall |
| **Requête interne** | `CardFetchRequestDTO` | Format des requêtes vers le service |
| **Réponse interne** | `CardServiceResponseDTO` | Format des réponses du service |
| **Données app** | `MTGCard` | Format unifié de l'application |
| **Configuration** | `ServiceConfig` | Configuration du service |

## 🚀 Prochaines Étapes

### Phase 2: Services Principaux
```
services/
├── CardService.ts          # Service principal pour les cartes
├── SetService.ts           # Service pour les sets
├── PricingService.ts       # Service pour les prix
└── index.ts               # Export services
```

### Phase 3: Infrastructure
```
infrastructure/
├── cache/
│   ├── CacheService.ts     # Service de cache
│   └── RedisCacheService.ts
├── rate-limit/
│   └── RateLimitService.ts # Gestion des limites
├── monitoring/
│   └── MonitoringService.ts # Monitoring et métriques
└── index.ts
```

### Phase 4: Strategy
```
strategy/
├── CardServiceStrategy.ts  # Stratégie de sélection d'API
├── FallbackStrategy.ts     # Stratégie de fallback
└── index.ts
```

## 🎨 Design Patterns Implémentés

| Pattern | Fichiers | Rôle |
|---------|----------|------|
| **Adapter** | `adapters/ScryfallAdapter.ts` | Transformation de format |
| **Factory** | `factory/CardServiceFactory.ts` | Création d'objets |
| **Strategy** | `strategy/` (à créer) | Sélection d'algorithme |
| **Facade** | `services/` (à créer) | Interface unifiée |
| **DTO** | `dto/` | Transfert de données |

## 🔧 Utilisation

```typescript
// Import depuis le point d'entrée principal
import { 
  CardServiceFactory, 
  ScryfallProvider, 
  ScryfallAdapter 
} from '@/card-api-service'

// Ou import spécifique
import { ScryfallProvider } from '@/card-api-service/providers/ScryfallProvider'
import { ScryfallAdapter } from '@/card-api-service/adapters/ScryfallAdapter'
```

## 📊 Métriques de Code

- **Total fichiers** : 17 fichiers TypeScript
- **Interfaces** : 4 interfaces principales
- **DTOs** : 20+ types de DTOs
- **Providers** : 1 implémenté (Scryfall)
- **Adapters** : 1 implémenté (Scryfall)
- **Exemples** : 6 exemples d'utilisation

## 🎯 Avantages de cette Structure

✅ **Séparation claire** des responsabilités  
✅ **Extensibilité** facile pour nouveaux providers  
✅ **Testabilité** de chaque composant  
✅ **Maintenabilité** du code  
✅ **Réutilisabilité** des composants  
✅ **Type Safety** avec TypeScript  
✅ **Documentation** intégrée  
