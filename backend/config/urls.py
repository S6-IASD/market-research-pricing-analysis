"""
URL configuration for Market Research project.
"""

from django.contrib import admin
from django.urls import path

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from products.views import ProductListView, ProductDetailView
from search.views import SearchView, SearchStatusView, AnalyzeDataView
from config.auth_views import RegisterView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token-obtain'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),

    # Products
    path('api/products/', ProductListView.as_view(), name='product-list'),
    path('api/products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),

    # Search & Scraping & Data Mining
    path('api/search/', SearchView.as_view(), name='search'),
    path('api/search/analyze/', AnalyzeDataView.as_view(), name='search-analyze'),
    path('api/search/<str:task_id>/status/', SearchStatusView.as_view(), name='search-status'),
]
