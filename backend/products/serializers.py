"""
DRF Serializers for Product and SearchHistory models.
"""

from rest_framework import serializers
from products.models import Product, SearchTask


class ProductSerializer(serializers.ModelSerializer):
    """Serializer complet pour un produit (avec données de prix annotées)."""
    price = serializers.FloatField(read_only=True)
    price_usd = serializers.FloatField(read_only=True)
    currency = serializers.CharField(read_only=True)
    rating = serializers.FloatField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    scraped_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'title', 'url', 'image',
            'platform', 'seller',
            'category', 'subcategory',
            'search_query', 'first_seen', 'last_seen',
            # Champs annotés venant de PriceSnapshot
            'price', 'currency', 'price_usd',
            'rating', 'reviews_count', 'scraped_at',
        ]
        read_only_fields = ['id', 'first_seen', 'last_seen']


class SearchTaskSerializer(serializers.ModelSerializer):
    """Serializer pour le suivi des tâches de recherche Celery."""

    class Meta:
        model = SearchTask
        fields = [
            'id', 'task_id', 'query', 'user',
            'status', 'result_count', 
            'created_at', 'finished_at'
        ]
        read_only_fields = ['id', 'created_at']
