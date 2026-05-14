# V. Partie Frontend

Cette section décrit les choix techniques, l’implémentation et les résultats obtenus pour l'interface utilisateur.

## Architecture React

L'application front-end est développée comme une **Single Page Application (SPA)** utilisant **React** et propulsée par le bundler ultra-rapide **Vite**. 

*   **Routage** : Géré par `react-router-dom` pour une navigation fluide sans rechargement de page. L'application est structurée en plusieurs vues principales : `HomePage` (recherche), `ProductsListPage` (liste des résultats), `AnalysisPage` (dashboard Data Mining), et les pages d'authentification (`LoginPage`, `RegisterPage`).
*   **Gestion d'état globale** : L'état global est géré via l'API Context de React. Nous avons implémenté un `AuthContext` (pour garder la session de l'utilisateur active à travers l'application) et un `ThemeContext` (pour la bascule dynamique entre le mode Clair et Sombre).
*   **Structuration** : Séparation stricte entre les pages (`src/pages`), les composants réutilisables (`src/components`), les appels réseaux (`src/api`), et les contextes (`src/context`).

[Insérer screenshot ici : Capture d'écran du code montrant l'arborescence du dossier frontend/src]

## Dashboard

La page d'analyse (`AnalysisPage.tsx`) est le cœur visuel de la plateforme. Elle a pour but de traduire le JSON complexe renvoyé par le service de Data Mining en insights compréhensibles.

*   **Recharts** : Nous avons utilisé cette librairie basée sur D3.js pour générer des graphiques performants et réactifs.
    *   *BarChart* : Utilisé pour afficher l'histogramme de distribution des prix (répartition par tranches).
    *   *ComposedChart* : Une combinaison astucieuse de barres et de points pour simuler des "BoxPlots", illustrant le minimum, les quartiles (Q1, Q3), la médiane et le maximum des prix par plateforme (Jumia, eBay, AliExpress).
    *   *PieChart* : Montre la répartition des produits par cluster (Entrée, Milieu, Haut de gamme).
*   **Insights métiers** : Une section dédiée utilise les composants List d'Ant Design pour afficher textuellement les règles d'association générées par l'algorithme FP-Growth (ex: "Confiance de 85%").

[Insérer screenshot ici : Capture d'écran de l'AnalysisPage montrant les différents graphiques générés]

## Polling asynchrone

Pour gérer le problème du temps d'attente lors du scraping (Deep Search), le frontend implémente une logique de **Polling**.

*   **Implémentation** : Lorsque l'utilisateur lance une recherche approfondie, le frontend reçoit immédiatement un `task_id`. Au lieu d'attendre la fin de la requête (ce qui causerait un timeout), React utilise la fonction `setInterval` pour interroger l'API (`/api/search/<task_id>/status/`) toutes les 2 secondes.
*   **Retour visuel** : Tant que le statut est "pending" ou "running", une barre de progression et un loader (Spin) informent l'utilisateur. Dès que le statut passe à "done", le frontend redirige automatiquement l'utilisateur vers la page d'analyse ou de liste.

[Insérer screenshot ici : Capture d'écran de la barre de progression sur la HomePage pendant le scraping]

## Authentification JWT

Côté client, la sécurité est assurée par une gestion robuste des JSON Web Tokens (JWT).

*   **Client API Custom** : Nous avons créé un module `client.ts` avec la fonction `apiFetch`. Cette fonction s'assure d'intercepter toutes les requêtes sortantes pour injecter le token d'accès (`Authorization: Bearer <token>`) dans les Headers.
*   **Stockage** : Les tokens sont stockés dans le `localStorage` du navigateur.
*   **Protection des Routes** : Un composant métier `ProtectedRoute.tsx` entoure les routes sensibles (Dashboard, Produits). Si le token est absent ou expiré, l'utilisateur est automatiquement redirigé vers la page `/login`.

[Insérer screenshot ici : Extrait de code de apiFetch ou ProtectedRoute]

## UX/UI (Pages, Fonctionnalités, Animations)

Le design se veut moderne, professionnel (type "Dashboard Enterprise") et fluide.

*   **Framework UI (Ant Design)** : Fournit l'ossature visuelle de la plateforme. Utilisation intensive des `Cards` avec ombres portées, des `Badges` de statut, de `Typography` pour la hiérarchie visuelle, et des formulaires pré-validés.
*   **Animations (Framer Motion)** : Intégration de la librairie `framer-motion` pour des micro-interactions. Les cartes de produits, les statistiques et les graphiques apparaissent avec des effets de fondu (fade-in) et de léger zoom, donnant une sensation de réactivité et de qualité à l'application.
*   **Responsive Design** : Le système de grilles d'Ant Design (`Col`, `Row`) assure un affichage adaptatif sur desktop, tablette et mobile.

[Insérer screenshot ici : Capture d'écran du mode sombre et des animations sur la page d'accueil]


# VI. Déploiement & Infrastructure

Cette section décrit l'organisation du déploiement, des environnements et de l'orchestration des conteneurs.

## Docker Compose

Le projet est entièrement conteneurisé. Le fichier `docker-compose.yml` orchestre **6 services distincts** interconnectés dans un réseau virtuel fermé :
1.  `db` (PostgreSQL)
2.  `redis` (Cache & Broker)
3.  `backend` (Serveur Django)
4.  `celery_worker` (Travailleur asynchrone pour le scraping)
5.  `celery_beat` (Planificateur de tâches)
6.  `frontend` (Serveur Node/Vite)

Grâce à Docker, le projet est "Plug & Play" : une seule commande (`docker compose up -d --build`) suffit pour monter toute l'infrastructure, peu importe le système d'exploitation de l'hôte.

[Insérer screenshot ici : Capture du terminal montrant les 6 conteneurs Docker en statut 'Running']

## Variables d'environnement

La configuration de l'application est centralisée via des variables d'environnement, ce qui facilite la portabilité.
*   **Frontend** : `VITE_API_URL` (actuellement configuré sur `http://localhost:8000` via le fichier `docker-compose.yml`).
*   **Backend** : Les variables comme `DATABASE_URL` et `REDIS_URL` sont définies directement dans le `docker-compose.yml` pour lier les conteneurs entre eux. Des variables comme `DEBUG` et `SECRET_KEY` sont utilisées pour contrôler l'environnement d'exécution Django dans `settings.py`.

[Insérer screenshot ici : Extrait du fichier docker-compose.yml montrant l'injection des variables d'environnement]

## Configuration Actuelle (Environnement de Développement)

Étant donné que le système n'est pas encore déployé, nous travaillons avec une configuration orientée "Développement" :
*   **Frontend** : Lancé via la commande `npm run dev` (spécifiée dans le `Dockerfile` frontend), utilisant le serveur de développement Vite.
*   **Backend** : Lancé via la commande `python manage.py runserver 0.0.0.0:8000` (définie dans le `docker-compose.yml`). Il s'agit du serveur de développement intégré à Django, avec le mode `DEBUG="True"` activé explicitement pour faciliter le traçage des erreurs.

[Insérer screenshot ici : Comparaison des commandes de lancement ou configuration Nginx]


# VII. Conclusion

## Résultats

L'objectif principal du projet a été atteint : nous avons développé une plateforme **Full-Stack complète et intelligente**. Le système est capable de s'interfacer avec le web pour extraire des milliers de données tarifaires, de déléguer ce travail à une infrastructure asynchrone robuste (Celery/Redis), et d'appliquer automatiquement des algorithmes d'IA (Data Mining) pour fournir des insights visuels instantanés via une interface React très soignée. 

## Limites

*   **Sensibilité du Scraping** : Le scraping est intrinsèquement fragile. Les changements de structure DOM sur Jumia ou AliExpress, ou l'activation agressive de Captchas anti-bots, peuvent temporairement casser l'extraction.
*   **Gourmandise des Ressources** : L'intégration du Machine Learning et de Playwright rend l'image Docker du backend très volumineuse (plusieurs Go). Cela nécessite un serveur d'hébergement avec suffisamment de RAM et de stockage, causant parfois des erreurs locales sur des machines limitées.
*   **Algorithme des Mots-clés** : Comme identifié, l'extracteur ignore les mots courts ("16 gb"), ce qui peut fausser certaines recherches extrêmement précises.

## Perspectives

1.  **Système de Proxy Dynamique** : L'implémentation complète d'un `ProxyManager` (dont les bases existent déjà dans `utils/proxy_manager.py`) avec rotation d'IP est la prochaine étape cruciale pour contourner les blocages anti-bots d'AliExpress et eBay à grande échelle.
2.  **Machine Learning Prédictif** : Au-delà du clustering descriptif, intégrer des modèles de régression pour prédire les baisses de prix futures d'un produit (Prévision des tendances).
3.  **Système d'Alertes** : Permettre à l'utilisateur de s'abonner à un produit (via son email), et utiliser Celery Beat pour le notifier automatiquement si une anomalie de prix à la baisse est détectée.

[Insérer screenshot ici : Maquette ou diagramme illustrant l'évolution future (ex: Alertes email)]
