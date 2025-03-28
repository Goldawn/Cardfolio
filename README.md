# 🧙‍♂️ Cardfolio - Version 0.1.1

**Cardfolio** est une application web permettant de gérer et visualiser une collection de cartes **Magic: The Gathering**.  
Cette version 0.1.1 introduit une **connexion à une base de données SQLite via Prisma**, assurant une gestion persistente et robuste de la collection.

---

## ✨ Fonctionnalités

### 📦 Gestion de collection (connectée à la base de données)
- Importation de cartes depuis un set Magic: The Gathering (via l'API Scryfall)
- Ajout de cartes à sa collection avec suivi de la **quantité possédée** et de l'**historique des prix**
- Suppression et modification des quantités via l'interface
- Les cartes sont désormais **stockées dans une base de données Prisma**

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

## 🧱 Nouveauté : Prisma + base de données

Cardfolio utilise désormais **Prisma ORM** avec une base de données **SQLite** (stockée localement par défaut).  
Chaque utilisateur pourra prochainement avoir sa propre collection, wishlist, et ses decklists.

---

## 🚀 Lancer le projet en local

### 1. Cloner et installer les dépendances

```bash
git clone https://github.com/votre-utilisateur/cardfolio.git
cd cardfolio
npm install
npm run dev
```

### 2. Initialiser Prisma

```bash
npx prisma init --datasource-provider sqlite
```

### 3. Créer et synchroniser la base

```bash
npx prisma db push
```

### 4. (Optionnel) Lancer Prisma Studio pour visualiser vos données

```bash
npx prisma studio
```

### 5. Lancer le serveur de développement

```bash
npm run dev
```


> Le projet utilise **Next.js 15+** (avec `app/`), assurez-vous d'avoir Node.js 18+ installé.

---

## 🔮 Prochaines étapes (v0.2+)

✨ Wishlist et gestion de cartes à acquérir
✨ Deck builder avec gestion de listes de jeu
🔐 Authentification des utilisateurs
📊 Plus de statistiques et visualisations avancées
📤 Export/Import JSON ou CSV
📱 Interface responsive mobile

## 🛠️ Technologies utilisées

React (Next.js) avec App Router
Prisma + SQLite (ou toute base compatible à venir)
Context API pour la gestion de la devise
Recharts pour les graphiques
Scryfall API pour les données cartes
CSS Modules pour le style

## 📄 Licence

Ce projet est sous licence **MIT**.

---

## 💡 Remarques

Cardfolio est encore en phase de construction 🚧  
Toute suggestion ou contribution est la bienvenue !