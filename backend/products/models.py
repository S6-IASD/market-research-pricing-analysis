"""
Models for the products app.

4 modèles :
- Product         : produit unique identifié par son URL
- PriceSnapshot   : historique des prix à chaque scraping
- SearchTask      : suivi des tâches Celery de scraping
- AnalysisResult  : résultats du data mining
"""

from django.conf import settings
from django.db import models


# ── Product ──────────────────────────────────────────────────

class Product(models.Model):
    """
    Produit scrapé depuis Jumia, eBay ou AliExpress.
    L'URL sert de clé naturelle : un même produit n'est jamais dupliqué.
    """

    PLATFORM_CHOICES = [
        ('jumia', 'Jumia'),
        ('ebay', 'eBay'),
        ('aliexpress', 'AliExpress'),
    ]

    title = models.CharField(max_length=500)
    url = models.URLField(max_length=2000, unique=True)
    platform = models.CharField(max_length=50, choices=PLATFORM_CHOICES)
    category = models.CharField(max_length=100)
    subcategory = models.CharField(max_length=100, blank=True, default='')
    image = models.URLField(max_length=2000, blank=True, default='')
    seller = models.CharField(max_length=200, blank=True, default='')
    search_query = models.CharField(max_length=200)
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_seen']
        indexes = [
            models.Index(fields=['category'], name='idx_product_category'),
            models.Index(fields=['search_query'], name='idx_product_query'),
            models.Index(fields=['platform'], name='idx_product_platform'),
        ]

    def __str__(self):
        return f"[{self.platform}] {self.title[:80]}"


# ── PriceSnapshot ────────────────────────────────────────────

class PriceSnapshot(models.Model):
    """
    Instantané de prix pour un produit à un moment donné.
    Permet de suivre l'évolution des prix dans le temps.
    """

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='snapshots',
    )
    price = models.FloatField()
    price_usd = models.FloatField()
    currency = models.CharField(max_length=10)
    rating = models.FloatField(null=True, blank=True)
    reviews_count = models.IntegerField(default=0)
    scraped_at = models.DateTimeField()

    class Meta:
        ordering = ['-scraped_at']
        indexes = [
            models.Index(
                fields=['product', 'scraped_at'],
                name='idx_snapshot_product_date',
            ),
        ]

    def __str__(self):
        return f"{self.product.title[:40]} — {self.price} {self.currency} @ {self.scraped_at:%Y-%m-%d}"


# ── SearchTask ───────────────────────────────────────────────

class SearchTask(models.Model):
    """
    Suivi d'une tâche de scraping lancée via Celery.
    Liée à l'utilisateur qui a déclenché la recherche.
    """

    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('running', 'En cours'),
        ('done', 'Terminé'),
        ('failed', 'Échoué'),
    ]

    task_id = models.CharField(max_length=200, unique=True)
    query = models.CharField(max_length=200)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='search_tasks',
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
    )
    result_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.status}] '{self.query}' — {self.result_count} résultats"


# ── AnalysisResult ───────────────────────────────────────────

class AnalysisResult(models.Model):
    """
    Résultat d'une analyse data mining stocké en JSON.
    is_latest=True marque le résultat le plus récent pour un couple (query, type).
    """

    ANALYSIS_TYPE_CHOICES = [
        ('stats', 'Statistiques descriptives'),
        ('cluster', 'Clustering'),
        ('anomaly', 'Détection d\'anomalies'),
        ('association', 'Règles d\'association'),
    ]

    query = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    analysis_type = models.CharField(max_length=20, choices=ANALYSIS_TYPE_CHOICES)
    result_json = models.JSONField()
    computed_at = models.DateTimeField(auto_now_add=True)
    is_latest = models.BooleanField(default=True)

    class Meta:
        ordering = ['-computed_at']
        indexes = [
            models.Index(
                fields=['query', 'analysis_type', 'is_latest'],
                name='idx_analysis_query_type',
            ),
        ]

    def __str__(self):
        return f"[{self.analysis_type}] '{self.query}' — {'latest' if self.is_latest else 'old'}"
