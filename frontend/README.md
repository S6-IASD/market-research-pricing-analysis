# Market Research & Pricing Analysis - Frontend

Il s'agit de l'application front-end pour la plateforme d'analyse de marché et de tarification. Elle est construite avec React, Vite et TypeScript, offrant une interface utilisateur moderne, réactive et dynamique.

## 🚀 Technologies utilisées

- **Framework**: [React 19](https://react.dev/) avec [Vite](https://vitejs.dev/)
- **Langage**: TypeScript
- **Style**: [Tailwind CSS 4](https://tailwindcss.com/) & [Ant Design 5](https://ant.design/)
- **Graphiques et Visualisation de données**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Routage**: [React Router](https://reactrouter.com/)

## 📂 Structure du projet

```text
frontend/
├── src/
│   ├── api/          # Client API et configurations des requêtes
│   ├── components/   # Composants UI réutilisables (En-têtes, Cartes, etc.)
│   ├── context/      # Fournisseurs de contexte React (Thème, Auth, etc.)
│   ├── pages/        # Pages principales de l'application (Accueil, Analyse, etc.)
│   ├── App.tsx       # Composant principal de l'application
│   ├── index.css     # Styles globaux et directives Tailwind
│   └── main.tsx      # Point d'entrée de l'application
├── public/           # Ressources statiques
├── package.json      # Dépendances et scripts
└── vite.config.ts    # Configuration de Vite
```

## 🛠️ Démarrage

### Prérequis

Assurez-vous d'avoir Node.js (version 18+ recommandée) et npm (ou yarn/pnpm) installés sur votre machine.

### Installation

1. Accédez au répertoire frontend :
   ```bash
   cd frontend
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```

### Lancer le serveur de développement

Pour démarrer le serveur de développement local :

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5173`.

### Compiler pour la production

Pour créer une version optimisée pour la production :

```bash
npm run build
```

Les fichiers compilés seront générés dans le dossier `dist`.

## ✨ Fonctionnalités

- **Thème dynamique** : Prend en charge les modes Clair et Sombre avec des transitions fluides.
- **Visualisation de données** : Graphiques interactifs pour la distribution des prix et la segmentation du marché.
- **Design réactif** : Mise en page entièrement responsive, optimisée pour ordinateurs, tablettes et mobiles.
- **Export PDF** : Générez et téléchargez des rapports d'analyse nativement.
