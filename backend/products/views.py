"""
API views for products.
"""

from rest_framework import generics, filters
from django.db.models import OuterRef, Subquery
from products.models import Product, PriceSnapshot
from products.serializers import ProductSerializer


def get_annotated_product_queryset():
    latest_snapshot = PriceSnapshot.objects.filter(
        product=OuterRef('pk')
    ).order_by('-scraped_at')
    
    return Product.objects.annotate(
        price=Subquery(latest_snapshot.values('price')[:1]),
        price_usd=Subquery(latest_snapshot.values('price_usd')[:1]),
        currency=Subquery(latest_snapshot.values('currency')[:1]),
        rating=Subquery(latest_snapshot.values('rating')[:1]),
        reviews_count=Subquery(latest_snapshot.values('reviews_count')[:1]),
        scraped_at=Subquery(latest_snapshot.values('scraped_at')[:1]),
    )


class ProductListView(generics.ListAPIView):
    """
    GET /api/products/
    
    Liste tous les produits scrapés.
    Supporte le filtrage par query params: ?platform=jumia&category=electronics&search=laptop
    """
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'seller', 'category']
    ordering_fields = ['price', 'price_usd', 'rating', 'first_seen']

    def get_queryset(self):
        qs = get_annotated_product_queryset()
        
        # Filtres optionnels
        platform = self.request.query_params.get('platform')
        if platform:
            qs = qs.filter(platform=platform)
        
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        
        search_query = self.request.query_params.get('query')
        if search_query:
            qs = qs.filter(search_query__icontains=search_query)

        min_price = self.request.query_params.get('min_price')
        if min_price:
            qs = qs.filter(price__gte=float(min_price))

        max_price = self.request.query_params.get('max_price')
        if max_price:
            qs = qs.filter(price__lte=float(max_price))
        
        return qs


class ProductDetailView(generics.RetrieveAPIView):
    """
    GET /api/products/<id>/
    
    Détail d'un produit.
    """
    serializer_class = ProductSerializer
    
    def get_queryset(self):
        return get_annotated_product_queryset()
