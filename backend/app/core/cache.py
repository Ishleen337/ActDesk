import time
import threading
from typing import Any, Optional, Dict

class MemoryCache:
    """Thread-safe in-memory cache with TTL support (simulating Redis key-value store)."""
    def __init__(self):
        self._store: Dict[str, Any] = {}
        self._expiry: Dict[str, float] = {}
        self._lock = threading.Lock()

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        with self._lock:
            self._store[key] = value
            if ttl_seconds is not None:
                self._expiry[key] = time.time() + ttl_seconds
            elif key in self._expiry:
                del self._expiry[key]

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._store:
                return None
            if key in self._expiry and time.time() > self._expiry[key]:
                del self._store[key]
                del self._expiry[key]
                return None
            return self._store[key]

    def delete(self, key: str) -> None:
        with self._lock:
            self._store.pop(key, None)
            self._expiry.pop(key, None)

    def exists(self, key: str) -> bool:
        return self.get(key) is not None

    def invalidate_prefix(self, prefix: str) -> None:
        with self._lock:
            keys_to_del = [k for k in self._store.keys() if k.startswith(prefix)]
            for k in keys_to_del:
                self._store.pop(k, None)
                self._expiry.pop(k, None)

# Global cache singleton
cache = MemoryCache()

# TTL constants based on PRD
SESSION_TTL_SECONDS = 30 * 60       # 30 minutes
IDEMPOTENCY_TTL_SECONDS = 24 * 3600  # 24 hours
ORDER_STATUS_TTL_SECONDS = 60        # 60 seconds
