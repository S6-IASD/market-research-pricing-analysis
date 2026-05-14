# Rapport Détaillé : Market Research Pricing Analysis

Ce document explique en détail le fonctionnement interne de l'application, l'architecture du backend, les processus de scraping et de data mining, ainsi que l'orchestration Docker.

---

## 1. Vue d'Ensemble du Processus (Comment l'application fonctionne)

Le flux de travail de l'application se déroule ainsi :
1. **L'utilisateur lance une recherche** (ex: "laptop") sur le front-end React.
2. La requête arrive au **Backend Django** sur la route `/api/search/`.
3. Le backend vérifie si l'utilisateur demande un **"Deep Search"** (recherche approfondie avec scraping en direct).
   - Si OUI, le backend délègue la tâche de scraping à un **Worker Celery** (pour ne pas bloquer le serveur) et utilise **Redis** comme courtier de messages (Broker).
   - Le worker Celery lance des "Spiders" (robots) qui naviguent sur Jumia, eBay et AliExpress, extraient les prix et les sauvegardent dans la **Base de données PostgreSQL**.
4. Une fois les données en base, l'utilisateur demande une **Analyse (Data Mining)** via la route `/api/search/analyze/`.
5. Le backend récupère tous les prix associés à "laptop" depuis PostgreSQL, applique des algorithmes de Machine Learning (K-Means, Isolation Forest, FP-Growth), et **met en cache** le résultat.
6. Le **Frontend React** récupère ce JSON complexe et dessine des graphiques interactifs (Recharts).

---

## 2. Le Backend (Django REST Framework) en Détail

Le backend est structuré autour de plusieurs applications Django : `products`, `search`, `tasks`, et `datamining`.

### 2.1. Les Modèles de Données (PostgreSQL)
- **`Product`** : Représente un produit unique. L'URL du produit sert d'identifiant unique pour éviter les doublons.
- **`PriceSnapshot`** : Conserve l'historique des prix. À chaque fois qu'un produit est scrapé à nouveau, un nouveau Snapshot est créé, permettant de suivre l'évolution temporelle.
- **`SearchTask`** : Garde une trace des requêtes de scraping asynchrones (ID de tâche, statut "pending/running/done", utilisateur).
- **`AnalysisResult`** : Le système de cache pour le Data Mining. Contient le gros JSON avec les graphiques et règles générées pour éviter de recalculer les modèles ML à chaque clic.

### 2.2. Les Routes (Endpoints API)
- `POST /api/auth/register/` & `POST /api/auth/token/` : Gestion de l'authentification sécurisée avec **JWT (JSON Web Tokens)**.
- `GET /api/products/` : Liste et filtre les produits existants (recherche full-text optimisée via `SearchVector` de PostgreSQL).
- `POST /api/search/` : Reçoit la requête utilisateur. Si `deep_search=True` est envoyé, lance la tâche asynchrone de scraping et retourne un `task_id`.
- `GET /api/search/<task_id>/status/` : Permet au front-end de faire du "polling" (vérifier toutes les 2 secondes si le scraping est fini).
- `GET /api/search/analyze/?q=motcle` : Déclenche ou récupère l'analyse Data Mining.

---

## 3. Le Système Asynchrone : Celery & Redis

Le scraping est une tâche très lente. Si Django s'en occupait directement, la connexion web "planterait" (timeout). L'architecture résout ce problème avec **Celery** et **Redis**.

### 3.1. Le rôle de Redis
- **Message Broker** : Quand Django veut lancer un scraping, il ne le fait pas. Il écrit un message dans Redis : *"Hé, quelqu'un doit scraper le mot 'laptop'"*.
- **Rate Limiting (Cache)** : Redis est aussi utilisé pour compter combien de "Deep Search" un utilisateur a fait aujourd'hui (limite de 5 par jour).

### 3.2. Le rôle de Celery
- **`celery_worker`** : Un processus qui écoute en permanence Redis. Dès qu'il voit le message *"scraper 'laptop'"*, il prend la tâche, exécute le module Playwright/BeautifulSoup, sauvegarde les produits dans PostgreSQL, et met à jour le statut de la tâche (done/failed).
- **`celery_beat`** (Scheduled Tasks) : C'est le planificateur (cron). Il exécute la tâche `weekly_refresh_task` tous les lundis à 3h du matin, qui relance automatiquement le scraping pour les 20 recherches les plus populaires afin de garder la base de données fraîche.

---

## 4. Intégration du Scraping

Le scraping est situé dans le dossier `scraping/`.
- Il utilise **Playwright** (qui simule un vrai navigateur Chromium) pour AliExpress, car ce site nécessite du JavaScript.
- Il utilise **BeautifulSoup4** et **lxml** pour Jumia et eBay car ces sites fournissent du HTML statique, ce qui est beaucoup plus rapide.
- **Keyword Extractor** : Le système nettoie la recherche (ex: "je veux un laptop pas cher" -> "laptop"). *(Note : un problème avec les mots de <= 2 lettres comme '16 gb' a été identifié et discuté)*.

---

## 5. Intégration du Data Mining (Intelligence Artificielle)

Le code d'analyse se trouve dans `backend/products/services/datamining_service.py`. Quand `/api/search/analyze/` est appelé :

1. **Extraction de BDD** : Django récupère tous les `PriceSnapshots` récents liés au mot clé.
2. **K-Means Clustering** : Segmente automatiquement les prix en 3 groupes (Entrée de gamme, Milieu, Haut de gamme).
3. **Anomalies (Isolation Forest + LOF)** : Détecte les produits suspects (ex: un câble vendu au prix d'un PC, ou un PC beaucoup trop peu cher). Le vote combiné des 2 algos limite les faux positifs.
4. **FP-Growth (Règles d'association)** : Utilise la librairie `mlxtend` pour générer des insights (Ex: *Si Plateforme=eBay => Haut de gamme avec une confiance de 85%*).
5. **Préparation Graphique** : Calcule les intervalles (`bins`) pour l'histogramme des prix et les quartiles (Q1, Q3, Médiane) pour les BoxPlots.
6. **Mise en cache** : Tout ce calcul lourd est sauvegardé dans la table `AnalysisResult`. La prochaine fois qu'un utilisateur demande cette analyse, elle sort directement du cache en moins d'une seconde.

---

## 6. Utilisation de Docker

Le projet entier est orchestré par **Docker Compose**.
Le fichier `docker-compose.yml` définit 5 services :
1. `db` : PostgreSQL.
2. `redis` : Base in-memory.
3. `backend` : L'API Django.
4. `celery_worker` : Le travailleur de fond (utilise la même image que le backend).
5. `celery_beat` : Le planificateur (utilise la même image que le backend).
6. `frontend` : Le serveur de développement React/Vite.

### Détails Techniques Docker
- **L'image Backend est lourde** : Parce qu'elle doit installer les bibliothèques de Data Science (`pandas`, `scikit-learn`, `mlxtend`) ET les dépendances système de `Playwright` (Chromium, librairies C++).
- **Problème de build** : En raison de sa taille, construire l'image peut épuiser le stockage (`EOF error`). Il faut souvent nettoyer Docker (`docker system prune -a --volumes`) avant de reconstruire.
- **Compilation Optimisée** : Pour rebuild correctement après un changement (comme l'ajout de `mlxtend`), la commande `docker compose up -d --build backend celery_worker celery_beat` est utilisée pour mettre à jour les conteneurs Python sans toucher à la base de données.
