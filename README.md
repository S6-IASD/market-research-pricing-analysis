# 🛒 Market Research Pricing Analysis

Plateforme d'analyse intelligente de prix sur plusieurs marketplaces e-commerce.

---

## 📑 Sommaire

- [Architecture du projet](#️-architecture-du-projet)
- [Démarrage rapide](#-démarrage-rapide)
  - [Prérequis](#prérequis)
  - [Lancer avec Docker (recommandé)](#-lancer-tout-le-projet-avec-docker-recommandé)
  - [Installation locale](#-installation-locale-développement)
- [Module Scraping](#️-module-scraping)
- [Dépendances principales](#-dépendances-principales)
- [Tests](#-tests)
- [Équipe](#-équipe)

---

## 🏗️ Architecture du projet

```text
market-research-pricing-analysis/
├── data/                    # Données brutes et traitées
├── data_mining/             # Module d'analyse et machine learning
│   └── inputs/              # Exports CSV/JSON du scraping
├── docs/                    # Documentation
│   └── API_SCRAPING.md      # Guide d'intégration pour le Backend
├── frontend/                # Interface utilisateur (React/Vue/Angular)
├── scraping/                # Module de collecte de données
│   ├── spiders/             # Récupération HTML par plateforme
│   ├── parsers/             # Extraction des données
│   ├── pipelines/           # Nettoyage et standardisation
│   ├── services/            # Orchestration et export
│   ├── utils/               # Outils partagés
│   └── tests/               # Tests de validation
├── backend/                 # API Django (autre membre)
└── README.md                # Ce fichier
```

---

## 🚀 Démarrage rapide

### Prérequis

| Outil | Usage |
| ----- | ----- |
| Docker et Docker Compose | Lancer tout le projet (recommandé) |
| Python 3.10+ | Scraping en local |
| Node.js 18+ | Frontend en local |
| Git | Cloner le projet |
| Playwright | Scraping d'AliExpress |

### 🐳 Lancer tout le projet avec Docker (recommandé)

La façon la plus simple de lancer l'application complète (Frontend, Backend, Base de données, Redis, Scraping) est d'utiliser Docker Compose.

**1. Cloner le projet**

```bash
git clone https://github.com/VOTRE_USERNAME/market-research-pricing-analysis.git
cd market-research-pricing-analysis
```

**2. Construire et démarrer les conteneurs**

```bash
docker-compose up --build
```

> La première construction peut prendre quelques minutes.

**3. Accéder à l'application**

| Service | URL |
| ------- | --- |
| Interface Frontend | <http://localhost:3000> (ou le port défini dans votre config) |
| API Backend | <http://localhost:8000/api> |

**4. Arrêter l'application**

```bash
docker-compose down
```

---

### 💻 Installation locale (développement)

Si vous souhaitez lancer les modules séparément, sans Docker.

#### 1. Frontend (interface utilisateur)

```bash
cd frontend
npm install
npm run dev
```

#### 2. Scraping et Backend (Python)

Depuis la racine du projet cloné :

```bash
# Créer l'environnement virtuel
python -m venv venv
```

Activer l'environnement :

| Système | Commande |
| ------- | -------- |
| Windows | `.\venv\Scripts\activate` |
| Mac / Linux | `source venv/bin/activate` |

Installer les dépendances :

```bash
pip install -r requirements.txt

# Installer le navigateur pour Playwright
playwright install chromium
```

---

## 🕷️ Module Scraping

### Structure du module

| Dossier | Rôle |
| ------- | ---- |
| `spiders/` | Récupère le HTML de Jumia, eBay, AliExpress |
| `parsers/` | Extrait les données brutes (titre, prix, URL...) |
| `pipelines/` | Nettoie, normalise et valide les données |
| `services/` | Orchestrateur + export CSV/JSON |
| `utils/` | Client HTTP, logger |

### Tester le module

```bash
# Test complet (3 plateformes)
python -m scraping.tests.test_integration

# Test rapide (1 plateforme)
python -c "from scraping.services.scraper_service import get_scraper_service; s = get_scraper_service(); r = s.scrape('laptop', platforms=['jumia']); print('Produits:', r['stats']['total_products'])"
```

### Point d'entrée pour le Backend

📖 Documentation complète : [`docs/API_SCRAPING.md`](docs/API_SCRAPING.md)

---

## 📦 Dépendances principales

| Package | Version | Usage |
| ------- | ------- | ----- |
| `requests` | 2.31.0 | HTTP pour Jumia / eBay |
| `beautifulsoup4` | 4.12.2 | Parsing HTML |
| `lxml` | 5.2.1 | Parser rapide |
| `fake-useragent` | 1.4.0 | Headers réalistes |
| `playwright` | 1.43.0 | Navigateur pour AliExpress |

---

## 🧪 Tests

```bash
# Test d'une plateforme spécifique
python -m scraping.tests.test_jumia
python -m scraping.tests.test_ebay
python -m scraping.tests.test_aliexpress

# Test d'intégration complet
python -m scraping.tests.test_integration
```

---

## 🤝 Équipe

| Rôle | Membre | Module |
| ---- | ------ | ------ |
| Scraping et collecte | Salma | `scraping/` |
| Data Mining | Othmane | `data_mining/` |
| Backend API | Kamal | `backend/` |
| Frontend | Abderrahim | `frontend/` |
