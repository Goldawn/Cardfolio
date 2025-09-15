# 🚀 Guide de Refactorisation - MTGCard → GameCard

## 📋 Vue d'ensemble

Ce guide détaille la refactorisation complète pour utiliser uniquement les types génériques `GameCard` au lieu des types spécifiques `MTGCard`.

## ✅ Ce qui a été fait

### 1. **Helpers de types créés**

- `src/types/utils/transformers.ts` - Transformations génériques
- `src/types/utils/cardHelpers.ts` - Helpers pour remplacer les transformations manuelles

### 2. **Adapters refactorisés**

- `ScryfallAdapter` utilise maintenant `GameCard`
- Méthodes `transformCard()` et `transformCards()` retournent `GameCard`

### 3. **Services refactorisés**

- `CardService` utilise `GameCard`
- `FormatCard.ts` utilise `GameCard`
- DTOs mis à jour pour `GameCard`

## 🔄 Transformations à effectuer

### **Remplacer les transformations manuelles**

#### ❌ Ancien code (à remplacer)

```typescript
// Dans WishlistSearchSection.tsx
const formattedResults = results.map(
  card =>
    ({
      id: card.externalId,
      externalId: card.externalId,
      name: card.name,
      gameType: card.gameType,
      // ... autres propriétés
    }) as unknown as MTGCard
)
```

#### ✅ Nouveau code (avec helpers)

```typescript
import { transformSearchResults } from '@/types/utils/cardHelpers'

const formattedResults = transformSearchResults(results)
```

### **Remplacer les imports**

#### ❌ Ancien

```typescript
import type { MTGCard } from '@/types/games/magic'
```

#### ✅ Nouveau

```typescript
import type { GameCard } from '@/types/utils/guards'
```

### **Remplacer les types dans les composants**

#### ❌ Ancien

```typescript
const [cards, setCards] = useState<MTGCard[]>([])
const handleCard = (card: MTGCard) => { ... }
```

#### ✅ Nouveau

```typescript
const [cards, setCards] = useState<GameCard[]>([])
const handleCard = (card: GameCard) => { ... }
```

## 📁 Fichiers à refactoriser

### **Composants (25 fichiers)**

```bash
# Rechercher les fichiers utilisant MTGCard
grep -r "MTGCard" src/app/components/ --include="*.tsx" --include="*.ts"
```

**Fichiers prioritaires :**

1. `src/app/components/WishlistSearchSection.tsx` ✅ (partiellement fait)
2. `src/app/components/Card.tsx` ✅ (déjà utilise GameCard)
3. `src/app/components/FetchCardInput.tsx`
4. `src/app/components/CardModal.tsx`
5. `src/app/components/deck/ManualAdd.tsx`
6. `src/app/components/deck/DeckRow.tsx`

### **Services et Hooks**

1. `src/app/mtg/collection/CollectionClient.tsx`
2. `src/app/mtg/decklist/[id]/DeckClient.tsx`
3. `src/app/mtg/importer/hooks/useCards.ts`
4. `src/app/services/Collection.ts` ✅ (déjà utilise GameCard)

### **Libs et Utils**

1. `src/lib/mtgSections.ts`
2. `src/lib/deckStats.ts`
3. `src/lib/mtgCards.tsx`

## 🛠️ Helpers disponibles

### **Transformations**

```typescript
import {
  transformSearchResults,
  transformCollectionCards,
  transformDeckCards,
  transformFetchedCard,
  transformManualCard,
  transformImportedCard,
} from '@/types/utils/cardHelpers'
```

### **Création de cartes**

```typescript
import {
  createGameCard,
  createMinimalCard,
  updateCard,
} from '@/types/utils/cardHelpers'
```

### **Utilitaires**

```typescript
import {
  filterValidCards,
  groupCardsByGameType,
  findCardById,
  findCardByName,
  createCardMap,
} from '@/types/utils/cardHelpers'
```

## 🔍 Type Guards pour la spécialisation

Quand vous avez besoin d'accéder aux propriétés spécifiques MTG :

```typescript
import { isMTGCard } from '@/types/utils/guards'

function processCard(card: GameCard) {
  // Logique commune
  console.log(card.name, card.gameType)

  // Spécialisation MTG si nécessaire
  if (isMTGCard(card)) {
    console.log(card.gameData.manaCost) // Accès aux propriétés MTG
    console.log(card.colors) // Couleurs MTG
  }
}
```

## 📝 Checklist de migration

### **Pour chaque fichier :**

- [ ] Remplacer `import type { MTGCard }` par `import type { GameCard }`
- [ ] Remplacer `MTGCard[]` par `GameCard[]`
- [ ] Remplacer `MTGCard` par `GameCard` dans les paramètres
- [ ] Remplacer les transformations manuelles par les helpers
- [ ] Ajouter les type guards si accès aux propriétés spécifiques
- [ ] Tester le composant/service

### **Vérifications :**

- [ ] Plus d'imports `MTGCard` dans les composants
- [ ] Plus de transformations manuelles `as unknown as MTGCard`
- [ ] Utilisation des helpers pour les transformations
- [ ] Type guards pour la spécialisation quand nécessaire
- [ ] Tests passent

## 🚨 Points d'attention

1. **Type Guards** : Utilisez `isMTGCard()` pour accéder aux propriétés spécifiques MTG
2. **Transformations** : Utilisez les helpers au lieu des transformations manuelles
3. **Compatibilité** : L'architecture existante reste compatible
4. **Performance** : Les helpers sont optimisés et réutilisables

## 🎯 Résultat attendu

- ✅ Un seul type `GameCard` partout
- ✅ Plus de transformations manuelles
- ✅ Code plus maintenable et extensible
- ✅ Prêt pour l'ajout d'autres jeux
- ✅ Type safety préservé avec les type guards

## 🔧 Commandes utiles

```bash
# Trouver tous les usages de MTGCard
grep -r "MTGCard" src/ --include="*.ts" --include="*.tsx"

# Trouver les transformations manuelles
grep -r "as unknown as MTGCard" src/ --include="*.ts" --include="*.tsx"

# Vérifier les imports
grep -r "from '@/types/games/magic'" src/ --include="*.ts" --include="*.tsx"
```

---

**Note :** Cette refactorisation préserve la fonctionnalité existante tout en rendant le code plus générique et extensible pour l'ajout de nouveaux jeux.

