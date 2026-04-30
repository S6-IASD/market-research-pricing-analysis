"""
Celery configuration for Market Research project.
"""

import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('market_research')

# Load config from Django settings, using the CELERY_ namespace
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# ── Celery Beat Schedule ─────────────────────────────────────
app.conf.beat_schedule = {
    'weekly-refresh-popular-queries': {
        'task': 'tasks.scraping_tasks.weekly_refresh_task',
        'schedule': crontab(hour=3, minute=0, day_of_week='monday'),
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to verify Celery is working."""
    print(f'Request: {self.request!r}')
