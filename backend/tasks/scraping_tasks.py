"""
Tâches Celery pour le scraping.

- deep_search_task   : scraping live via le module scraping existant
- weekly_refresh_task : rafraîchissement hebdomadaire des requêtes populaires
"""

import logging
from random import randint

from celery import shared_task
from django.db.models import Count
from django.utils import timezone

from products.models import Product, PriceSnapshot, SearchTask

logger = logging.getLogger(__name__)


# ── Tâche 1 — Deep Search ───────────────────────────────────

@shared_task(bind=True, max_retries=2)
def deep_search_task(self, query: str, task_db_id: int = None):
    """
    Lance un scraping live sur toutes les plateformes via le module scraping,
    sauvegarde les produits et snapshots en base, et met à jour la SearchTask.

    Args:
        query:      Mots-clés nettoyés à rechercher.
        task_db_id: ID de la SearchTask en DB (None si appel depuis weekly_refresh).
    """
    from scraping.services.scraper_service import get_scraper_service

    # ── Marquer la tâche comme running ──
    if task_db_id is not None:
        _update_task_status(task_db_id, "running")

    try:
        # ── Appel au module scraping ──
        service = get_scraper_service()
        result = service.scrape(query=query)
        products_data = result.get("products", [])

        # ── Sauvegarde en base ──
        saved_count = 0
        for p in products_data:
            try:
                # get_or_create sur l'URL (clé unique)
                product, created = Product.objects.get_or_create(
                    url=p["url"],
                    defaults={
                        "title": p.get("title", ""),
                        "platform": p.get("platform", ""),
                        "category": p.get("category", ""),
                        "subcategory": p.get("subcategory", ""),
                        "image": p.get("image", ""),
                        "seller": p.get("seller", ""),
                        "search_query": query,
                    },
                )

                # Mettre à jour last_seen (même si le produit existait déjà)
                if not created:
                    product.last_seen = timezone.now()
                    product.save(update_fields=["last_seen"])

                # Créer un PriceSnapshot
                scraped_at = _parse_datetime(p.get("scraped_at"))

                PriceSnapshot.objects.create(
                    product=product,
                    price=p.get("price", 0),
                    price_usd=p.get("price_usd", 0),
                    currency=p.get("currency", "MAD"),
                    rating=p.get("rating"),
                    reviews_count=p.get("reviews_count", 0),
                    scraped_at=scraped_at or timezone.now(),
                )

                saved_count += 1

            except Exception as e:
                logger.warning(f"Produit ignoré ({p.get('url', '?')}): {e}")
                continue

        # ── Marquer la tâche comme terminée ──
        if task_db_id is not None:
            _update_task_status(task_db_id, "done", result_count=saved_count)

        logger.info(f"Deep search terminé: '{query}' — {saved_count} produits sauvegardés")
        return {"query": query, "saved": saved_count}

    except Exception as exc:
        logger.error(f"Erreur deep_search '{query}': {exc}")

        # ── Retry avec backoff exponentiel : 60s, 120s ──
        countdown = 60 * (2 ** self.request.retries)

        try:
            raise self.retry(exc=exc, countdown=countdown)
        except self.MaxRetriesExceededError:
            # Max retries dépassé → marquer comme failed
            if task_db_id is not None:
                _update_task_status(task_db_id, "failed")
            logger.error(f"Deep search définitivement échoué: '{query}'")
            raise


# ── Tâche 2 — Rafraîchissement hebdomadaire ─────────────────

@shared_task
def weekly_refresh_task():
    """
    Récupère les 20 requêtes les plus fréquentes et relance
    un deep_search pour chacune, avec un délai aléatoire.
    """
    top_queries = (
        Product.objects
        .values("search_query")
        .annotate(count=Count("id"))
        .order_by("-count")[:20]
    )

    launched = 0
    for entry in top_queries:
        query = entry["search_query"]
        if not query:
            continue

        # Espacer les requêtes avec un countdown aléatoire (30s à 120s)
        delay = randint(30, 120)
        deep_search_task.delay(query=query, task_db_id=None, countdown=delay)
        launched += 1

        logger.info(f"Weekly refresh: '{query}' planifié dans {delay}s")

    logger.info(f"Weekly refresh terminé: {launched} tâches lancées")
    return {"launched": launched}


# ── Helpers ──────────────────────────────────────────────────

def _update_task_status(task_db_id: int, status: str, result_count: int = 0):
    """Met à jour le statut d'une SearchTask en base."""
    try:
        task = SearchTask.objects.get(id=task_db_id)
        task.status = status
        update_fields = ["status"]

        if status == "done":
            task.result_count = result_count
            task.finished_at = timezone.now()
            update_fields += ["result_count", "finished_at"]
        elif status == "failed":
            task.finished_at = timezone.now()
            update_fields.append("finished_at")

        task.save(update_fields=update_fields)

    except SearchTask.DoesNotExist:
        logger.warning(f"SearchTask id={task_db_id} introuvable")


def _parse_datetime(value):
    """Parse une string ISO datetime, retourne None si invalide."""
    if not value or not isinstance(value, str):
        return None
    try:
        from datetime import datetime
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None
