# Guide de Migration des Types

## 🎯 Objectif

Ce guide explique comment migrer les types existants vers la nouvelle structure cohérente avec la base de données.

## 📋 Changements Majeurs

### 1. **Identifiants de Cartes**

```typescript
// ❌ AVANT (spécifique à Scryfall)
scryfallId: string

// ✅ APRÈS (agnostique des APIs)
externalId: string
```

### 2. **Structure des Relations**

```typescript
// ❌ AVANT (relations indirectes)
export type Collection = {
  items: CollectionItem[]
}

export type CollectionItem = {
  cardId: string
  quantity: number
  // ...
}

// ✅ APRÈS (relations directes)
export type Collection = {
  cards: Card[]
}

export type Card = {
  collectionId?: string
  quantity?: number
  // ...
}
```

### 3. **Structure des Données de Cartes**

```typescript
// ❌ AVANT (champs séparés)
export type BaseCard = {
  id: string
  name: string
  gameData: TGameData
  colors?: TColor[]
  cardType?: TCardType
}

// ✅ APRÈS (aligné avec Prisma)
export type Card = {
  id: string
  externalId: string // ID externe
  name: string
  gameData: TGameData
  colors?: TColor[]
  cardType?: TCardType
  // + tous les champs de la BDD
}
```

## 🔄 Plan de Migration

### Étape 1: Remplacer les types de base

```bash
# Sauvegarder les anciens types
mv src/types/base.ts src/types/base-old.ts
mv src/types/base-updated.ts src/types/base.ts

# Faire de même pour les autres fichiers
mv src/types/collections.ts src/types/collections-old.ts
mv src/types/collections-updated.ts src/types/collections.ts
```

### Étape 2: Mettre à jour les imports

```typescript
// ❌ AVANT
import { BaseCard, CollectionItem } from '@/types'

// ✅ APRÈS
import { Card, Collection } from '@/types'
```

### Étape 3: Adapter les composants React

```typescript
// ❌ AVANT
interface CardProps {
  card: BaseCard
  collectionItem?: CollectionItem
}

// ✅ APRÈS
interface CardProps {
  card: Card
  // Plus besoin de collectionItem séparé
}
```

### Étape 4: Mettre à jour les services

```typescript
// ❌ AVANT
async function addToCollection(scryfallId: string) {
  // ...
}

// ✅ APRÈS
async function addToCollection(externalId: string) {
  // ...
}
```

## 🚨 Points d'Attention

### 1. **Gestion des IDs**

- Tous les `scryfallId` doivent devenir `externalId`
- Vérifier que les APIs retournent bien `externalId`

### 2. **Relations Directes**

- Plus besoin de tables de liaison (`CollectionItem`, `WishlistItem`, `DeckCard`)
- Les relations sont maintenant directes via `Card`

### 3. **Données JSON**

- `gameData`, `colors`, `legalities` sont stockés en JSON dans la BDD
- En TypeScript, ils restent typés pour la sécurité

### 4. **Quantités et Allocation**

- `quantity` et `allocated` sont maintenant dans `Card`
- Plus besoin de gérer ces champs séparément

## 📝 Checklist de Migration

- [ ] Remplacer `scryfallId` par `externalId` partout
- [ ] Mettre à jour les types de base (`BaseCard` → `Card`)
- [ ] Adapter les types de collections (relations directes)
- [ ] Mettre à jour les types de decks (relations directes)
- [ ] Adapter les composants React
- [ ] Mettre à jour les services
- [ ] Tester les fonctionnalités existantes
- [ ] Vérifier la cohérence avec la base de données

## 🧪 Tests de Validation

```typescript
// Test de cohérence des types
const card: Card = {
  id: 'uuid',
  externalId: 'scryfall-id',
  name: 'Lightning Bolt',
  gameType: 'magic',
  // ... autres champs
}

// Test de relation directe
const collection: Collection = {
  id: 'uuid',
  name: 'Main',
  cards: [card], // ✅ Relation directe
}
```

## 🎉 Résultat Final

Après migration, vous aurez :

- ✅ Types cohérents avec la base de données
- ✅ Relations directes simplifiées
- ✅ Identifiants agnostiques des APIs
- ✅ Structure unifiée pour tous les jeux

