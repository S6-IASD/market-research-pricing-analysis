# 📊 Market Research & Pricing Analysis — Data Mining Pipeline

**Licence IASD — Matière : Data Mining — 2025/2026**  
**Faculté des Sciences Semlalia — Marrakech**

> Pipeline complet de collecte, nettoyage, analyse et modélisation de prix de laptops  
> scrappés depuis plusieurs plateformes e-commerce (Jumia, eBay, AliExpress).

---

## 🗂️ Structure du projet

```
market-research-pricing-analysis/  
│  
├── data_mining/  
│   ├── notebooks/  
│   │   ├── phase0_extraction.ipynb       ← Extraction depuis le scraper  
│   │   ├── phase1_preprocessing.ipynb    ← Nettoyage & normalisation  
│   │   ├── phase2_statistical_analysis.ipynb  ← Analyse statistique  
│   │   ├── phase3_clustering.ipynb       ← Clustering K-Means + DBSCAN  
│   │   ├── phase4_anomaly_detection.ipynb ← Détection d'anomalies  
│   │   ├── phase5_association_rules.ipynb ← Règles d'association  
│   │   └── phase6_final_export.ipynb     ← Export final  
│   │  
│   ├── inputs/                           ← CSVs intermédiaires (générés)  
│   │   ├── laptop.csv                    ← Données brutes (Phase 0)  
│   │   ├── laptop_phase1.csv             ← Données nettoyées  
│   │   ├── laptop_phase2.csv             ← + stats & price_range  
│   │   ├── laptop_phase3.csv             ← + clusters  
│   │   ├── laptop_phase4.csv             ← + anomalies  
│   │   └── laptop_final.csv              ← Dataset enrichi final  
│   │  
│   └── outputs/                          ← JSONs & graphiques (générés)  
│       ├── dashboard_data.json           ← Pour Django/React  
│       ├── stats_summary.json  
│       ├── anomalies_report.json  
│       ├── association_rules.json  
│       ├── association_rules.csv  
│       └── *.png                         ← Toutes les visualisations  
│  
├── scraping/                             ← Module de scraping  
│   ├── services/  
│   │   ├── scraper_service.py            ← get_scraper_service()  
│   │   └── data_exporter.py             ← DataExporter  
│   ├── spiders/                          ← Jumia, eBay, AliExpress  
│   └── pipelines/                        ← Normalizer, Cleaner, Validator  
│  
├── backend/                              ← Django REST API  
├── frontend/                             ← React.js Dashboard  
└── requirements.txt  
```

---

## ⚡ Pipeline — Vue d'ensemble

```
Phase 0 : Scraping  
    ↓   laptop.csv (données brutes)  
Phase 1 : Prétraitement  
    ↓   laptop_phase1.csv (données propres)  
Phase 2 : Analyse Statistique  
    ↓   laptop_phase2.csv (+ price_range)  
Phase 3 : Clustering  
    ↓   laptop_phase3.csv (+ cluster_kmeans_label, cluster_dbscan)  
Phase 4 : Détection d'Anomalies  
    ↓   laptop_phase4.csv (+ is_anomaly, anomaly_type, scores)  
Phase 5 : Règles d'Association  
    ↓   association_rules.csv / .json  
Phase 6 : Export Final  
    ↓   laptop_final.csv + dashboard_data.json  
```

---

## 📦 Phase 0 — Extraction depuis le scraper

**Notebook** : `phase0_extraction.ipynb`  
**Output** : `inputs/laptop.csv`

Cette phase lance le scraper sur les plateformes cibles et exporte les résultats bruts.

```python
import sys
sys.path.insert(0, '/home/theowner/Desktop/Repo_DM/market-research-pricing-analysis')

from scraping.services.scraper_service import get_scraper_service
from scraping.services.data_exporter import DataExporter

# Lancer le scraping
service = get_scraper_service()
result  = service.scrape(query="laptop")

# Exporter le dataset brut
exporter = DataExporter()
exporter.output_dir = "../inputs"
csv_path = exporter.to_csv(result['products'], "laptop.csv")
```

**Résultat brut** : dataset contenant des champs tels que `title`, `price`, `platform`, `url`, `seller`, `rating`, `scraped_at`, ainsi que des produits hors-sujet (RAM, souris, SSD externe...) et des colonnes quasi-vides (`attributes`, `match_reason`, `rating`).

**Plateformes scrapées** :

| Plateforme | Type |
|---|---|
| Jumia.ma | Marocaine |
| eBay | Internationale |
| AliExpress | Internationale |

---

## 🧹 Phase 1 — Prétraitement

**Notebook** : `phase1_preprocessing.ipynb`  
**Input** : `laptop.csv`  
**Output** : `laptop_phase1.csv`

### Opérations effectuées

**Suppression des colonnes inutiles** — `price_raw`, `attributes` (100% vide `{}`), `match_reason` (96% NaN), `sku`, `image`, `seller`, `rating` (100% NaN), `reviews_count` (100% zéro).

**Filtrage des produits hors-sujet** — mots-clés positifs (laptop, notebook, thinkpad, macbook...) et négatifs (ram, ddr4, souris, mouse, powerbank, external ssd...).

**Suppression des doublons** — sur URL d'abord, puis sur `(title, price, platform)`.

**Gestion des valeurs manquantes** — suppression des lignes sans prix ; `search_query` NaN → `"laptop"`.

**Normalisation des prix** — fourchette réaliste 1 500–80 000 MAD ; ajout de `price_usd` (÷ 10).

**Extraction automatique depuis le titre** :

| Colonne | Logique |
|---|---|
| `brand` | Dictionnaire de 20 marques connues (HP, Dell, Lenovo, Asus...) |
| `ram_gb` | Valeurs dans `{2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 128}` |
| `storage_gb` | Valeurs ≥ 64 Go ou en TB (converti en Go) |

La distinction RAM / Stockage repose sur le fait que les valeurs RAM forment un ensemble fini connu, tandis que le stockage est toujours ≥ 256 Go ou exprimé en TB.

**Nettoyage URL** — suppression des paramètres de tracking AliExpress (`?...`).

### Résultat

```
Avant : ~N produits (bruts, hors-sujet inclus)
Après : ~N produits laptops valides
Colonnes finales : title, brand, price, price_usd, currency,
                   platform, ram_gb, storage_gb, category,
                   search_query, url, scraped_date
```

---

## 📈 Phase 2 — Analyse Statistique Descriptive

**Notebook** : `phase2_statistical_analysis.ipynb`  
**Input** : `laptop_phase1.csv`  
**Output** : `laptop_phase2.csv`, `stats_summary.json`, `stats_by_platform.csv`, `stats_by_brand.csv`

### Opérations effectuées

- **Statistiques descriptives globales** : min, max, médiane, moyenne, écart-type, Q1, Q3, IQR
- **Statistiques par plateforme et par marque**
- **Création de `price_range`** : classification en 3 gammes via Q1/Q3
  - `bas_de_gamme` : prix < Q1
  - `milieu_de_gamme` : Q1 ≤ prix ≤ Q3
  - `haut_de_gamme` : prix > Q3
- **Analyse RAM & Stockage** : distribution, prix médian par niveau

### Visualisations produites

| Fichier | Description |
|---|---|
| `phase2_distribution_prix.png` | Histogramme de distribution |
| `phase2_boxplot_platform.png` | Boxplot comparatif par plateforme |
| `phase2_median_par_marque.png` | Prix médian par marque (top 10) |
| `phase2_repartition_gamme.png` | Répartition bas/milieu/haut de gamme |
| `phase2_heatmap_marque_platform.png` | Heatmap marque × plateforme |
| `phase2_violin_platform.png` | Violin plot par plateforme |
| `phase2_price_vs_ram.png` | Scatter prix vs RAM |
| `phase2_price_vs_storage.png` | Scatter prix vs stockage |

---

## 🔵 Phase 3 — Clustering

**Notebook** : `phase3_clustering.ipynb`  
**Input** : `laptop_phase2.csv`  
**Output** : `laptop_phase3.csv`

### Features utilisées

```
['price', 'ram_gb', 'storage_gb']
```

> `rating` et `reviews_count` écartés car 100% NaN / 100% zéro (supprimés dès la Phase 1).

Les lignes sans `ram_gb` ou `storage_gb` sont exclues du fitting puis ré-assignées au cluster le plus proche sur la base du prix seul.

### Algorithmes

**K-Means** — nombre de clusters k optimisé via la méthode du coude (Elbow) et le score de silhouette. Les clusters sont labelisés automatiquement (`bas_de_gamme`, `milieu_de_gamme`, `haut_de_gamme`) selon le prix médian de chaque groupe.

**DBSCAN** — clustering basé sur la densité, sans nombre de clusters fixé. Les points non assignés (`cluster = -1`) sont traités comme du bruit. Paramètres `eps` et `min_samples` optimisés par grille.

**PCA** — réduction en 2D pour visualiser les clusters dans un espace interprétable.

### Colonnes ajoutées

| Colonne | Description |
|---|---|
| `cluster_kmeans` | Numéro du cluster K-Means (0, 1, 2...) |
| `cluster_kmeans_label` | Label lisible (bas/milieu/haut_de_gamme) |
| `cluster_dbscan` | Numéro du cluster DBSCAN (-1 = bruit) |

### Visualisations produites

| Fichier | Description |
|---|---|
| `phase3_elbow.png` | Méthode du coude pour K-Means |
| `phase3_silhouette.png` | Score de silhouette par k |
| `phase3_clusters_pca.png` | Clusters en 2D via PCA |
| `phase3_clusters_ram_prix.png` | Scatter RAM vs Prix coloré par cluster |
| `phase3_profil_clusters.png` | Profil prix/RAM/stockage par cluster |
| `phase3_dbscan.png` | Résultats DBSCAN |

---

## 🚨 Phase 4 — Détection d'Anomalies

**Notebook** : `phase4_anomaly_detection.ipynb`  
**Input** : `laptop_phase3.csv`  
**Output** : `laptop_phase4.csv`, `anomalies_report.json`

> Un prix est **suspect** s'il est anormalement bas (arnaque probable) ou anormalement haut (erreur de saisie / produit surévalué) par rapport à ses caractéristiques.

### Algorithmes

**Isolation Forest** — construit des arbres de décision aléatoires. Un point est anormal s'il est isolé rapidement (chemin court dans l'arbre). `contamination = 0.10`.

**LOF (Local Outlier Factor)** — compare la densité locale d'un point à ses k plus proches voisins. Détecte des anomalies locales que l'Isolation Forest peut manquer. `n_neighbors = 10`.

### Stratégie de combinaison (Voting)

```
is_anomaly      = ISO ET LOF  →  anomalie certaine (forte confiance)
is_anomaly_soft = ISO OU LOF  →  anomalie possible
```

### Qualification automatique

```
prix < médiane des normaux  →  anomaly_type = "prix_suspect_bas"
prix ≥ médiane des normaux  →  anomaly_type = "prix_suspect_haut"
```

### Colonnes ajoutées

| Colonne | Description |
|---|---|
| `iso_score` | Score Isolation Forest (plus négatif = plus anormal) |
| `lof_score` | Score LOF (> 1 = anormal) |
| `anomaly_score` | Score combiné normalisé [0, 1] |
| `is_anomaly` | 1 si les deux algorithmes sont d'accord |
| `is_anomaly_soft` | 1 si au moins un algorithme détecte |
| `anomaly_type` | `normal` / `prix_suspect_bas` / `prix_suspect_haut` |
| `pca_x`, `pca_y` | Coordonnées PCA 2D |

### Visualisations produites

| Fichier | Description |
|---|---|
| `phase4_distribution_anomalies.png` | Distribution prix : normaux vs anomalies |
| `phase4_scatter_ram_anomalies.png` | Prix vs RAM (anomalies en rouge) |
| `phase4_scatter_storage_anomalies.png` | Prix vs stockage (anomalies en rouge) |
| `phase4_pca_anomalies.png` | Anomalies dans l'espace PCA 2D |
| `phase4_scores_iso_lof.png` | Scores des deux détecteurs |
| `phase4_anomalies_par_platform.png` | % d'anomalies par plateforme |

---

## 🔗 Phase 5 — Règles d'Association

**Notebook** : `phase5_association_rules.ipynb`  
**Input** : `laptop_phase4.csv`  
**Output** : `association_rules.csv`, `association_rules.json`

> Objectif : trouver des liens statistiquement significatifs entre les attributs d'un laptop et sa gamme de prix.  
> Exemple : *"Les laptops avec 16 Go RAM sur eBay ont 82% de chances d'être en milieu ou haut de gamme."*

### Discrétisation des variables

| Variable | Catégories |
|---|---|
| `ram_gb` | `ram_4go`, `ram_8go`, `ram_16go`, `ram_32go+` |
| `storage_gb` | `ssd_256go`, `ssd_512go`, `ssd_1to`, `ssd_2to+` |
| `brand` | `brand_hp`, `brand_dell`, ... `brand_other` |
| `platform` | `platform_jumia`, `platform_ebay`, `platform_aliexpress` |
| `gamme` | `bas_de_gamme`, `milieu_de_gamme`, `haut_de_gamme` |
| `anomaly_type` | `normal`, `prix_suspect_bas`, `prix_suspect_haut` |

### Algorithmes

**Apriori** — génère les itemsets fréquents par recherche exhaustive. `min_support = 0.15`.

**FP-Growth** — utilise une structure d'arbre compressée, plus rapide qu'Apriori. Même `min_support`. Les résultats sont comparés pour vérification de cohérence.

### Métriques des règles

| Métrique | Description |
|---|---|
| **Support** | Fréquence de la règle dans le dataset |
| **Confiance** | P(conséquent \| antécédent) |
| **Lift** | Confiance / support(conséquent) — lift > 1 = règle utile |
| **Leverage** | Différence entre fréquence observée et attendue |

### Filtres appliqués

- `min_confidence = 0.60`
- `min_lift = 1.0`
- Focus sur les règles dont le **conséquent est une gamme de prix**
- Focus secondaire sur les règles dont le **conséquent est une anomalie**

### Visualisations produites

| Fichier | Description |
|---|---|
| `phase5_support_confidence.png` | Scatter support vs confiance (coloré par lift) |
| `phase5_top_rules_lift.png` | Top 15 règles par lift |
| `phase5_heatmap_confidence.png` | Heatmap confiance antécédent × gamme |
| `phase5_network_graph.png` | Graphe réseau des règles (NetworkX) |
| `phase5_distributions.png` | Distribution support et lift |
| `phase5_brand_gamme.png` | Confiance marque → gamme (barplot groupé) |

---

## 📦 Phase 6 — Export Final

**Notebook** : `phase6_final_export.ipynb`  
**Input** : `laptop_phase4.csv` + tous les JSONs des phases précédentes  
**Output** : `laptop_final.csv`, `dashboard_data.json`

Cette phase consolide tous les résultats en un seul fichier et construit le JSON d'interface avec Django.

### `laptop_final.csv` — Structure

| Groupe | Colonnes |
|---|---|
| Identité | `title`, `brand`, `platform`, `url` |
| Prix | `price`, `price_usd`, `currency` |
| Specs | `ram_gb`, `ram_cat`, `storage_gb`, `storage_cat` |
| Classification | `price_range`, `gamme_finale` |
| Clustering | `cluster_kmeans`, `cluster_kmeans_label`, `cluster_dbscan` |
| Anomalies | `is_anomaly`, `is_anomaly_soft`, `anomaly_type`, `anomaly_score`, `iso_score`, `lof_score` |
| PCA | `pca_x`, `pca_y` |
| Méta | `category`, `search_query`, `scraped_date` |

### `dashboard_data.json` — Structure

```json
{
  "meta":              { "generated_at", "pipeline_phases", "query" },
  "global_stats":      { "total_products", "price_min/max/median/mean/std", ... },
  "by_platform":       [ { "platform", "count", "price_median", "n_anomalies" }, ... ],
  "by_gamme":          [ { "gamme", "count", "price_min/median/max", "top_brands" }, ... ],
  "top_brands":        [ { "brand", "count", "price_median" }, ... ],
  "price_histogram":   { "counts": [...], "edges": [...] },
  "anomalies":         [ { "title", "price", "platform", "anomaly_type", "anomaly_score" }, ... ],
  "association_rules": [ { "antecedents", "consequents", "support", "confidence", "lift" }, ... ],
  "products":          [ { toutes les colonnes par produit }, ... ]
}
```

### Visualisation produite

| Fichier | Description |
|---|---|
| `phase6_dashboard_recap.png` | Dashboard 6-panneaux : distribution, gammes, boxplot plateforme, top marques, anomalies par plateforme, scatter RAM vs prix |

---

## 🛠️ Installation & Lancement

```bash
# 1. Cloner le repo
git clone <repo_url>
cd market-research-pricing-analysis

# 2. Activer l'environnement virtuel
source venv/bin/activate   # Linux/Mac
venv\Scripts\activate      # Windows

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Installer mlxtend (Phase 5)
pip install mlxtend --break-system-packages

# 5. Lancer Jupyter
cd data_mining/notebooks
jupyter notebook
```

> **Important** : Toujours exécuter la cellule de setup `sys.path.insert(...)` en premier  
> dans chaque notebook — le path ne persiste pas entre les redémarrages du kernel.

```python
import sys
sys.path.insert(0, '/home/theowner/Desktop/Repo_DM/market-research-pricing-analysis')
```

---

## 📚 Technologies utilisées

| Couche | Technologie | Usage |
|---|---|---|
| Scraping | Scrapy / BeautifulSoup | Collecte des données |
| Data Mining | Pandas, NumPy | Manipulation des données |
| Machine Learning | Scikit-learn | Clustering, anomalies, PCA |
| Règles d'association | mlxtend | Apriori, FP-Growth |
| Visualisation | Matplotlib, Seaborn | Graphiques |
| Graphes | NetworkX | Graphe des règles |
| Backend | Django REST | API |
| Frontend | React.js | Dashboard |

---



**Licence IASD 2025/2026**  
Faculté des Sciences Semlalia — Marrakech