#!/usr/bin/env python

import os
import sys
import django
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sil_project.settings')
django.setup()

from store.tasks import test_celery_task

if __name__ == "__main__":
    print("Sending a test task to Celery...")
    
    result = test_celery_task.delay("This is a test message")
    
    timeout = 10
    print(f"Waiting for result (timeout: {timeout} seconds)...")
    
    try:
        task_result = result.get(timeout=timeout)
        print("✅ Success! Celery is working correctly.")
        print(f"Task result: {task_result}")
    except Exception as e:
        print("❌ Error: Could not get task result.")
        print(f"Exception: {e}")
        print("\nPossible issues:")
        print("1. Celery worker is not running")
        print("2. Redis is not running or not configured correctly")
        print("3. CELERY_BROKER_URL or CELERY_RESULT_BACKEND is incorrect")
        print("\nCheck the following:")
        print("- Is Redis running? Try: redis-cli ping")
        print("- Is Celery worker running? Run: celery -A sil_project worker -l info")
        print("- Check your .env configuration")
        sys.exit(1)
    
    sys.exit(0)