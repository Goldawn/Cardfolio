# 🧙‍♂️ Cardfolio - Version 0.1

**Cardfolio** est une application web permettant de gérer et visualiser une collection de cartes Magic: The Gathering.  
Ce projet est en cours de développement – cette version 0.1 marque une étape clé : les premières fonctionnalités principales sont désormais fonctionnelles.

---

## ✨ Fonctionnalités

### 📦 Gestion de collection
- Importation de cartes depuis un set Magic: The Gathering (via l'API Scryfall)
- Ajout de cartes à sa collection avec suivi de la **quantité possédée**
- Suppression et modification des quantités à tout moment

### 🔍 Filtres et tri dynamiques
- Recherche par **nom de carte**
- Filtres :
  - **Couleur** (WUBRG + Incolore et Multicolore)
  - **Type** (Créature, Terrain, Éphémère, etc.)
  - **Rareté** (Commun, Peu Commun, Rare, Mythique)
- Tri par :
  - Nom
  - Prix
  - Date d’ajout
  - Extension
  - Couleur

### 📊 Statistiques de collection
- Nombre total de cartes
- Nombre d’extensions représentées
- **Valeur totale estimée** (EUR / USD)
- Affichage du ratio possédé / total pour chaque extension

### 📁 Devise dynamique
- Bascule entre les prix **EUR** et **USD**

### 🔍 Modale de carte avancée
- Zoom sur une carte avec toutes ses infos (mana cost, oracle text, type, etc.)
- Support des **cartes double-face / transformables**
- Affichage du **graphique d’évolution des prix** dans le temps
- Navigation entre les cartes avec **flèches précédente / suivante**

---

## ⚖️ Prochaines étapes (v0.2+)
> Ces fonctionnalités sont envisagées pour les prochaines versions :

- Deck Builder et gestion de decks
- Wishlist et cartes à acquérir
- Plus de stats et visualisations graphiques
- Export/Import JSON ou CSV
- Suggestions de cartes basées sur la collection
- Comptes utilisateurs (authentification)
- Responsive mobile

---

## 🛠️ Technologies utilisées

- **React (Next.js)** avec App Router
- **Context API** pour la gestion globale de la devise
- **Recharts** pour l'affichage des graphiques
- **CSS Modules** pour le style
- **Scryfall API** pour récupérer les données des cartes

---

## 🚀 Lancer le projet en local

```bash
git clone https://github.com/votre-utilisateur/cardfolio.git
cd cardfolio
npm install
npm run dev
```

> Le projet utilise **Next.js 14+** (avec `app/`), assurez-vous d'avoir Node.js 18+ installé.

---

## 📄 Licence

Ce projet est sous licence **MIT**.

---

## 💡 Remarques

Cardfolio est encore en phase de construction 🚧  
Toute suggestion ou contribution est la bienvenue !