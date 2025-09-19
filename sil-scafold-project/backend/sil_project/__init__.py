# Initialize Celery
from .celery_app import app as celery_app  # noqa

__all__ = ['celery_app']