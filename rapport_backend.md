# III. Partie Backend

Cette section décrit les choix techniques, l’implémentation et les résultats obtenus pour la partie serveur de l'application.

## Architecture Django REST Framework

L'architecture du backend repose sur le framework Django couplé à Django REST Framework (DRF) pour exposer une API robuste. Nous avons opté pour une structure hautement modulaire basée sur le pattern architectural MVT (Model-View-Template) adapté au REST (Model-View-Serializer). 

Le code est divisé en plusieurs applications distinctes (Separation of Concerns) :
*   `config` : Configuration globale du projet et routage principal.
*   `products` : Gestion des produits, des historiques de prix (`PriceSnapshot`) et des services d'analyse.
*   `search` : Moteur de recherche intégrant la recherche locale et le déclenchement du scraping profond.
*   `tasks` : Gestion des processus en arrière-plan.

Cette architecture garantit une maintenance aisée et une évolutivité de la plateforme.

[Insérer screenshot ici : Arborescence du dossier backend ou diagramme MVT]

## Base de données PostgreSQL

Le choix de PostgreSQL s'est imposé en raison de sa robustesse et de ses capacités avancées, particulièrement pour la recherche.

*   **Modélisation relationnelle** :
    *   Le modèle `Product` utilise l'URL comme clé unique pour éviter la duplication des produits scrapés.
    *   Le modèle `PriceSnapshot` est lié à `Product` en relation One-to-Many, permettant de conserver l'historique temporel des prix lors des différents passages des robots de scraping.
    *   Le modèle `AnalysisResult` sert de système de cache persistant pour sauvegarder les volumineux résultats JSON du Data Mining.
*   **Recherche Full-Text (FTS)** : Nous avons exploité les fonctionnalités natives de PostgreSQL (`SearchVector`, `SearchQuery`, `SearchRank`) dans notre moteur de recherche pour offrir des résultats pertinents et classés par poids (titre vs catégorie) sans nécessiter d'outils externes comme Elasticsearch.

[Insérer screenshot ici : Schéma entité-association (ERD) de la base de données]

## JWT (JSON Web Tokens)

L'authentification et l'autorisation sont gérées par le standard JWT via la librairie `rest_framework_simplejwt`.

*   **Fonctionnement** : Lors de la connexion ou de l'inscription, l'utilisateur reçoit deux tokens :
    1.  Un *Access Token* (durée de vie : 60 minutes) utilisé pour authentifier les requêtes API.
    2.  Un *Refresh Token* (durée de vie : 7 jours) stocké de manière sécurisée côté client, permettant de renouveler l'Access Token sans obliger l'utilisateur à se reconnecter.
*   **Sécurité** : La rotation des Refresh Tokens est activée (`ROTATE_REFRESH_TOKENS=True`) et les anciens tokens sont mis sur liste noire pour empêcher le vol de session.

[Insérer screenshot ici : Exemple de requête/réponse Postman montrant l'obtention des tokens JWT]

## Celery + Redis

Le scraping étant un processus bloquant et imprévisible (temps de réponse des sites, anti-bots), il a été totalement découplé du cycle de vie de la requête HTTP grâce au duo Celery et Redis.

*   **Redis** : Joue un double rôle. Il est le *Message Broker* (courtier de messages) qui transmet les ordres de scraping de Django vers Celery, et il sert de cache rapide pour le mécanisme de Rate Limiting (limiter les utilisateurs à 5 requêtes de scraping par jour).
*   **Celery Worker** : Écoute les files d'attente Redis et exécute les scripts de scraping lourds en arrière-plan (tâche `deep_search_task`).
*   **Celery Beat** : Agit comme un planificateur (Cron). Il lance la tâche `weekly_refresh_task` toutes les semaines pour relancer automatiquement le scraping sur les requêtes les plus populaires afin de rafraîchir la base de données.

[Insérer screenshot ici : Logs du terminal montrant Celery recevant et traitant une tâche asynchrone]

## Intégration de la logique de Scraping et de Data Mining

La force de cette plateforme réside dans l'unification du Scraping et du Data Mining au sein d'un même pipeline backend.

### 1. Intégration du Scraping
Lorsqu'un utilisateur lance une "Recherche Approfondie" (Deep Search) :
1.  Le backend extrait les mots-clés significatifs (via `keyword_extractor.py`).
2.  Il génère une entité `SearchTask` en base de données avec le statut "Pending".
3.  Il envoie la requête à Celery.
4.  Le Worker Celery déclenche le module de scraping (`playwright`, `beautifulsoup4`) qui navigue sur Jumia, eBay et AliExpress.
5.  Les données extraites sont sauvegardées dans les modèles `Product` et `PriceSnapshot`. Le statut de la tâche passe à "Done".

### 2. Intégration du Data Mining
L'analyse des données est encapsulée dans `datamining_service.py` :
1.  **Récupération** : Les données sont extraites de PostgreSQL (`Product` + le dernier `PriceSnapshot`).
2.  **Traitement (Scikit-learn, Pandas, Mlxtend)** :
    *   *K-Means* : Segmentation automatique en 3 clusters (Entrée, Milieu, Haut de gamme).
    *   *Isolation Forest & LOF (Voting)* : Détection des anomalies (faux produits, prix absurdes).
    *   *FP-Growth* : Extraction de règles d'association (ex: "Jumia => Entrée de gamme").
3.  **Mise en Cache** : Le calcul complet prend du temps. Le dictionnaire de résultats (statistiques, données pour les graphiques Recharts) est converti en JSON et stocké dans le modèle `AnalysisResult`. Si un utilisateur demande la même analyse dans les 24h, le backend renvoie le résultat du cache instantanément (Sub-milliseconde).

[Insérer screenshot ici : Extrait de code du service datamining ou diagramme du pipeline ML]

## API REST : Liste des Routes et Leurs Rôles

Le backend expose un ensemble d'endpoints RESTFUL stricts. À l'exception de l'inscription et de la connexion, toutes les routes sont protégées (`IsAuthenticated`).

### Authentification (`/api/auth/`)
*   `POST /api/auth/register/` : Gère l'inscription, crée l'utilisateur en base et retourne instantanément la paire de tokens JWT.
*   `POST /api/auth/token/` : Vérifie les identifiants et génère les tokens JWT (Login).
*   `POST /api/auth/token/refresh/` : Prend un Refresh Token valide et retourne un nouvel Access Token.

### Produits (`/api/products/`)
*   `GET /api/products/` : Liste les produits scrapés existants. Supporte le filtrage par plateforme, catégorie, prix min/max, et le tri dynamique.
*   `GET /api/products/<id>/` : Retourne le détail complet d'un produit spécifique.

### Recherche et Scraping (`/api/search/`)
*   `POST /api/search/` : Reçoit la requête utilisateur. Effectue une recherche Full-Text dans PostgreSQL. Si l'option `deep_search=True` est présente, vérifie les limites Redis et déclenche la tâche Celery de scraping, puis retourne l'ID de la tâche (`task_id`).
*   `GET /api/search/<task_id>/status/` : Permet au Frontend de vérifier périodiquement (Polling) si la tâche de scraping est "pending", "running", "done" ou "failed", ainsi que le nombre de produits trouvés.
*   `GET /api/search/analyze/?q=motcle` : C'est le point d'entrée du Data Mining. Vérifie le cache `AnalysisResult`. S'il est valide, retourne le JSON. Sinon, exécute le pipeline complet d'IA (Clustering, Anomalies, Règles), met à jour le cache et retourne les données pour alimenter le Dashboard Frontend.

[Insérer screenshot ici : Documentation Swagger/Postman listant les endpoints de l'API]

## Sécurité

La sécurité a été intégrée à plusieurs niveaux de l'architecture :

*   **Séparation des environnements** : Les clés secrètes, URLs de base de données et configurations sensibles sont gérées via des variables d'environnement (`python-decouple`).
*   **CORS (Cross-Origin Resource Sharing)** : Strictement configuré via `django-cors-headers` pour n'accepter que les requêtes provenant du domaine Frontend autorisé.
*   **Protection des endpoints** : Validation rigoureuse des données entrantes via les Serializers DRF pour prévenir les injections SQL et les failles XSS. Permissions JWT exigées par défaut.
*   **Rate Limiting** : Protection contre les attaques DDoS et la surcharge des serveurs de scraping en limitant le déclenchement des tâches lourdes via le cache Redis.

[Insérer screenshot ici : Extrait du fichier settings.py montrant la configuration CORS ou JWT]
