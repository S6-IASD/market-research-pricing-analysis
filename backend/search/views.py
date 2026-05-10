"""
Search API views.

- SearchView       : POST /api/search/         — recherche DB + deep search optionnel
- SearchStatusView : GET  /api/search/<id>/status/ — statut d'une tâche de scraping
"""

from datetime import date, timedelta

from django.contrib.postgres.search import SearchVector, SearchRank, SearchQuery
from django.core.cache import cache
from django.db.models import Subquery, OuterRef, F
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product, PriceSnapshot, SearchTask
from search.keyword_extractor import extract_keywords
from tasks.scraping_tasks import deep_search_task


# ── Vue 1 — Recherche ───────────────────────────────────────

class SearchView(APIView):
    """
    POST /api/search/

    Body : { "query": "laptop gaming", "deep_search": false }

    1. Recherche full-text PostgreSQL dans les produits existants
    2. Si deep_search=True → lance un scraping Celery (limité à 5/jour)
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        raw_query = request.data.get("query", "").strip()
        deep_search = request.data.get("deep_search", False)
        category = request.data.get("category", None)
        platforms = request.data.get("platforms", None)

        if not raw_query:
            return Response(
                {"error": "Le champ 'query' est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 1. Extraction des mots-clés ──
        cleaned_query = extract_keywords(raw_query)
        if not cleaned_query:
            return Response(
                {"error": "Aucun mot-clé significatif détecté."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 2. Recherche full-text PostgreSQL ──
        db_results = self._search_db(cleaned_query)

        # ── 3. Deep search (scraping live) ──
        task_id = None
        if deep_search:
            task_id = self._handle_deep_search(request.user, cleaned_query, category, platforms)
            if task_id is None:
                return Response(
                    {"error": "Limite de 5 deep searches par jour atteinte."},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        # ── 4. Réponse ──
        return Response({
            "db_results": db_results,
            "task_id": task_id,
            "query": cleaned_query,
        })

    # ─────────────────────────────────────────────────────────

    def _search_db(self, cleaned_query: str) -> list:
        """
        Recherche full-text PostgreSQL :
        - SearchVector sur title (poids A) et category (poids B)
        - Filtre sur les PriceSnapshot des 7 derniers jours
        - Top 50 triés par rank puis price_usd
        """
        seven_days_ago = timezone.now() - timedelta(days=7)
        search_query = SearchQuery(cleaned_query, config="french")

        vector = (
            SearchVector("title", weight="A", config="french")
            + SearchVector("category", weight="B", config="french")
        )

        # Sous-requête : dernier snapshot de chaque produit
        latest_snapshot = (
            PriceSnapshot.objects
            .filter(product=OuterRef("pk"))
            .order_by("-scraped_at")
        )

        products = (
            Product.objects
            .annotate(
                rank=SearchRank(vector, search_query),
                latest_price=Subquery(latest_snapshot.values("price")[:1]),
                latest_price_usd=Subquery(latest_snapshot.values("price_usd")[:1]),
                latest_currency=Subquery(latest_snapshot.values("currency")[:1]),
                latest_rating=Subquery(latest_snapshot.values("rating")[:1]),
                latest_scraped_at=Subquery(latest_snapshot.values("scraped_at")[:1]),
            )
            .filter(
                rank__gt=0,
                snapshots__scraped_at__gte=seven_days_ago,
            )
            .distinct()
            .order_by("-rank", "latest_price_usd")[:50]
        )

        return [
            {
                "id": p.id,
                "title": p.title,
                "price_usd": p.latest_price_usd,
                "currency": p.latest_currency,
                "platform": p.platform,
                "category": p.category,
                "url": p.url,
                "image": p.image,
                "seller": p.seller,
                "rating": p.latest_rating,
                "scraped_at": p.latest_scraped_at,
            }
            for p in products
        ]

    # ─────────────────────────────────────────────────────────

    def _handle_deep_search(self, user, cleaned_query: str, category: str = None, platforms: list = None):
        """
        Lance un scraping via Celery si la limite quotidienne n'est pas atteinte.
        Retourne le task_id Celery ou None si limite dépassée.
        """
        # a. Vérifier la limite 5/jour via Redis
        cache_key = f"deepsearch_{user.id}_{date.today()}"
        count = cache.get(cache_key, 0)

        if count >= 5:
            return None

        import uuid
        task_uuid = str(uuid.uuid4())

        # b. Créer la SearchTask en DB
        search_task = SearchTask.objects.create(
            task_id=task_uuid,
            query=cleaned_query,
            user=user,
            status="pending",
        )

        # c. Lancer la tâche Celery
        celery_result = deep_search_task.apply_async(
            kwargs={
                "query": cleaned_query,
                "category": category,
                "platforms": platforms,
                "task_db_id": search_task.id,
            },
            task_id=task_uuid,
        )

        # d. Incrémenter le compteur Redis (expire à minuit)
        cache.set(cache_key, count + 1, timeout=self._seconds_until_midnight())

        return celery_result.id

    @staticmethod
    def _seconds_until_midnight() -> int:
        """Nombre de secondes jusqu'à minuit (pour l'expiration du cache)."""
        now = timezone.localtime()
        midnight = (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        return int((midnight - now).total_seconds())


# ── Vue 2 — Statut d'une tâche ──────────────────────────────

class SearchStatusView(APIView):
    """
    GET /api/search/<task_id>/status/

    Retourne le statut d'une tâche de scraping.
    404 si la tâche n'existe pas ou n'appartient pas à l'utilisateur.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        try:
            task = SearchTask.objects.get(
                task_id=task_id,
                user=request.user,
            )
        except SearchTask.DoesNotExist:
            return Response(
                {"error": "Tâche non trouvée."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            "status": task.status,
            "result_count": task.result_count,
            "finished_at": task.finished_at,
        })
