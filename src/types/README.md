# Types TypeScript - Cardfolio

Ce dossier contient tous les types TypeScript pour l'application Cardfolio, organisés de manière modulaire et extensible.

## Structure

```
src/types/
├── base.ts                 # Types de base communs à tous les jeux
├── collections.ts          # Types pour les collections et wishlists
├── decks.ts               # Types pour les decklists
├── games/                 # Types spécifiques par jeu
│   ├── magic.ts          # Magic: The Gathering
│   ├── pokemon.ts        # Pokémon
│   ├── lorcana.ts        # Disney Lorcana
│   ├── yugioh.ts         # Yu-Gi-Oh!
│   ├── flesh-and-blood.ts # Flesh and Blood
│   └── index.ts          # Export des types de jeux
├── utils/                 # Types utilitaires
│   ├── statistics.ts     # Types pour les statistiques
│   ├── filters.ts        # Types pour les filtres et tri
│   ├── guards.ts         # Type guards
│   ├── helpers.ts        # Fonctions et types helpers
│   └── index.ts          # Export des utilitaires
├── constants/             # Constantes par jeu
│   ├── magic.ts          # Constantes MTG
│   ├── pokemon.ts        # Constantes Pokémon
│   ├── lorcana.ts        # Constantes Lorcana
│   ├── yugioh.ts         # Constantes Yu-Gi-Oh!
│   ├── flesh-and-blood.ts # Constantes Flesh and Blood
│   └── index.ts          # Export des constantes
├── index.ts              # Export centralisé
└── README.md             # Ce fichier
```

## Utilisation

### Import simple
```typescript
import { MTGCard, PokemonCard, GameCard } from '@/types';
```

### Import spécifique
```typescript
import { MTGCard } from '@/types/games/magic';
import { CollectionStats } from '@/types/utils/statistics';
```

### Type guards
```typescript
import { isMTGCard, isPokemonCard } from '@/types/utils/guards';

if (isMTGCard(card)) {
  // card est maintenant typé comme MTGCard
  console.log(card.gameData.manaCost);
}
```

## Architecture

### Types génériques
Les types utilisent des génériques pour permettre l'extensibilité :
- `BaseCard<TGameData, TColor, TCardType, TFormat>`
- `Collection<TGameType>`
- `Decklist<TGameType, TColor, TFormat>`

### Type safety
- Type guards pour la vérification à l'exécution
- Union types pour les cartes de tous les jeux
- Helper types pour extraire les types spécifiques

### Extensibilité
Pour ajouter un nouveau jeu :
1. Créer un fichier dans `games/`
2. Définir les types spécifiques
3. Exporter dans `games/index.ts`
4. Ajouter les constantes dans `constants/`
5. Mettre à jour les type guards dans `utils/guards.ts`

## Exemples

### Créer une carte Magic
```typescript
import { createCard } from '@/types/utils/helpers';

const lightningBolt = createCard('magic', {
  id: '1',
  name: 'Lightning Bolt',
  gameType: 'magic',
  gameData: {
    manaCost: '{R}',
    cmc: 1,
    type: 'Instant',
    oracleText: 'Lightning Bolt deals 3 damage to any target.'
  },
  colors: ['R'],
  cardType: 'instant',
  format: 'modern'
});
```

### Filtrer par type de jeu
```typescript
import { isMTGCard } from '@/types/utils/guards';

const mtgCards = allCards.filter(isMTGCard);
```

### Statistiques de collection
```typescript
import { CollectionStats } from '@/types/utils/statistics';

const stats: CollectionStats<MTGColor, MTGCardType, CardRarity> = {
  totalCards: 1000,
  totalValue: 5000,
  byRarity: { common: 600, uncommon: 300, rare: 80, mythic: 20 },
  byColor: { W: 200, U: 200, B: 200, R: 200, G: 200 },
  byType: { creature: 400, instant: 200, sorcery: 200, land: 200 },
  bySet: { 'DOM': 100, 'M19': 100 }
};
```
