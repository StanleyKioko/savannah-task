import functools
from django.core.cache import cache
from django.conf import settings

def cached_view(timeout=None):
    if timeout is None:
        timeout = getattr(settings, 'CACHE_TIMEOUT', 900)
        
    def decorator(view_func):
        @functools.wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            if request.method != 'GET':
                return view_func(request, *args, **kwargs)
            
            cache_key = f"view:{request.get_full_path()}"
            
            response = cache.get(cache_key)
            if response is None:
                response = view_func(request, *args, **kwargs)
                cache.set(cache_key, response, timeout)
                
            return response
        return _wrapped_view
    return decorator


def cached_db_query(timeout=None):
    if timeout is None:
        timeout = getattr(settings, 'CACHE_TIMEOUT', 900)
        
    def decorator(query_func):
        @functools.wraps(query_func)
        def _wrapped_func(*args, **kwargs):
            key_parts = [query_func.__module__, query_func.__name__]
            for arg in args:
                key_parts.append(str(arg))
            for k, v in sorted(kwargs.items()):
                key_parts.append(f"{k}:{v}")
            
            cache_key = "db:" + ":".join(key_parts)
            
            result = cache.get(cache_key)
            if result is None:
                result = query_func(*args, **kwargs)
                cache.set(cache_key, result, timeout)
                
            return result
        return _wrapped_func
    return decorator