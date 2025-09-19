import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sil_project.settings')
app = Celery('sil_project')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
