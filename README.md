# 🧙‍♂️ Cardfolio - Version 0.2.0

**Cardfolio** est une application web complète pour gérer, visualiser et planifier votre collection de cartes **Magic: The Gathering**.  
Cette version **0.2.0** marque un **jalon majeur** : l’arrivée des **decklists**, des **wishlists**, et d’une meilleure intégration de la base de données avec **Prisma**.

---

## ✨ Fonctionnalités principales

### 📦 Gestion complète de la collection
- Importation des cartes directement via l’API **Scryfall**
- Ajout de cartes avec suivi des **quantités possédées**
- Historique automatique des **prix** pour chaque carte
- Modification des quantités en direct
- Suppression des cartes de la collection
- Stockage persistant via **Prisma + SQLite**

---

### 🗂 Gestion des decks (**NOUVEAU**)
- Création, modification et suppression de **decklists**
- Ajout / retrait de cartes d’un deck
- Gestion des **quantités** pour chaque carte
- **Carte mise en avant (showcased)** : définissez une carte vedette par deck, utilisée pour personnaliser son visuel
- Calcul automatique des **couleurs du deck** via les cartes présentes
- Gestion des **formats** (Commander, Standard, Modern, Pioneer, etc.)
- Vérification automatique de la **légalité des decks** :
  - Support des règles de singleton (Commander, Brawl, etc.)
  - Limitation à **4 exemplaires** pour les formats classiques
  - Gestion des cartes à copies illimitées (ex. *Relentless Rats*, *Dragon’s Approach*…)
- Notes personnelles sur chaque deck
- Dupliquer facilement un deck
- Verrouiller/déverrouiller un deck pour éviter les modifications accidentelles

---

### 🧾 Gestion des wishlists (**NOUVEAU**)
- Créez une ou plusieurs listes de souhaits
- Ajoutez rapidement des cartes à une liste existante
- Si aucune liste n’existe, **création automatique** d’une **wishlist par défaut**
- Sélection dynamique de la liste cible via un menu déroulant interactif
- Ajout massif des **cartes manquantes d’un deck** à une wishlist
- Organisation des cartes désirées par liste

---

### 🔍 Filtres et tri avancés
- Recherche rapide par **nom de carte**
- Filtres multiples :
  - **Couleur** (WUBRG + Incolore et Multicolore)
  - **Type** (Créature, Terrain, Éphémère, etc.)
  - **Rareté** (Commun, Peu Commun, Rare, Mythique)
- Tri possible par :
  - Nom
  - Prix
  - Date d’ajout
  - Extension
  - Couleur

---

### 📊 Statistiques détaillées
- Suivi du **nombre total de cartes**
- Comptage des **extensions représentées**
- **Valeur totale estimée** de la collection (EUR / USD)
- Aperçu du **ratio possédé / total** par extension
- *Prochainement* : statistiques détaillées par **deck**

---

### 🧑‍💻 Authentification sécurisée
- Connexion via **Google** ou **GitHub**
- Chaque utilisateur dispose de **ses propres données isolées** :
  - Collection
  - Decklists
  - Wishlists

---

### 🌍 Gestion de la devise
- Basculer entre **EUR** et **USD** à tout moment
- Les prix sont récupérés automatiquement via **Scryfall**

---

### 🖼 Modale de carte enrichie
- Zoom complet sur la carte
- Affichage du **coût de mana**, du **texte oracle** et de toutes les infos essentielles
- Gestion complète des **cartes recto-verso, transformables et flip**
- Graphique d’évolution du prix de la carte dans le temps
- Navigation rapide avec les flèches

---

## 🧱 Technologies utilisées

- **React (Next.js 15)** avec App Router
- **NextAuth.js v5** pour l’authentification
- **Prisma** (ORM + SQLite, PostgreSQL support à venir)
- **Context API** pour la gestion globale de la devise
- **Recharts** pour les graphiques
- **Scryfall API** pour toutes les données cartes
- **CSS Modules** pour les styles

---

## 🚀 Installation & démarrage

### 1. Cloner et installer les dépendances

```bash
git clone https://github.com/votre-utilisateur/cardfolio.git
cd cardfolio
npm install
```

### 2. Initialiser Prisma

```bash
npx prisma generate
npx prisma db push
npx prisma studio
```

### 3. Configurer les variables d’environnement

DATABASE_URL="file:./dev.db"
AUTH_GITHUB_ID="..."       # à récupérer sur GitHub Developer
AUTH_GITHUB_SECRET="..."
AUTH_GOOGLE_ID="..."       # à récupérer sur Google Developer Console
AUTH_GOOGLE_SECRET="..."
NEXTAUTH_SECRET="..."      # généré avec : openssl rand -base64 32

### 4. Lancer l'application

```bash
npm run dev
```


> Le projet utilise **Next.js 15+** (avec `app/`), assurez-vous d'avoir Node.js 18+ installé.

---

#### 🔮 Roadmap (v0.3+)

Fonctionnalités prévues pour les prochaines versions :

📤 Export/Import des decks (JSON, CSV, Arena, Moxfield…)

📌 Ajout rapide de toutes les cartes manquantes dans une wishlist spécifique

📊 Statistiques détaillées par deck : manabases, courbes de mana, coûts moyens…

📱 Amélioration de l’expérience mobile

🔗 Intégration avec des plateformes tierces (Moxfield, Archidekt…)

📄 Licence

Ce projet est sous licence MIT.

#### 💡 Remarques

Cardfolio est encore en phase de construction 🚧
Toute suggestion ou contribution est la bienvenue !

#### 🔖 Changelog rapide

##### v0.2.0 — Decklists + Wishlists (actuel)
- Ajout de la gestion complète des decks
- Ajout du système de wishlist avec création dynamique
- Vérification des légalités selon les formats
- Gestion des couleurs des decks automatique
- Amélioration de l’UX générale et persistance robuste des données
##### v0.1.1 — Prisma + Auth
- Connexion à Prisma + base SQLite
- Intégration de NextAuth
- Importation des cartes depuis Scryfall
- Gestion basique de la collection et affichage des prix