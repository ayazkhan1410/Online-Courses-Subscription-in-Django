"""Cache lockout: 15 minutes after 10 failed MFA codes.

shortcut: counters live in the default cache, which is per-process until
CACHES points at a shared backend. Do that before running more than one worker.
"""

from django.core.cache import cache

LOCKOUT_FAILURES = 10
LOCKOUT_SECONDS = 15 * 60


def _fail_key(user_id: int) -> str:
    return f'mfa_fail:{user_id}'


def _lock_key(user_id: int) -> str:
    return f'mfa_lock:{user_id}'


def is_locked(user_id: int) -> bool:
    return bool(cache.get(_lock_key(user_id)))


def record_failure(user_id: int) -> None:
    key = _fail_key(user_id)
    cache.add(key, 0, LOCKOUT_SECONDS)
    try:
        count = cache.incr(key)
    except ValueError:
        cache.set(key, 1, LOCKOUT_SECONDS)
        count = 1
    if count >= LOCKOUT_FAILURES:
        cache.set(_lock_key(user_id), 1, LOCKOUT_SECONDS)
        cache.delete(key)


def clear_failures(user_id: int) -> None:
    cache.delete(_fail_key(user_id))
