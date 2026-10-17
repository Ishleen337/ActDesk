import time
import threading
from typing import Dict, List
from fastapi import HTTPException, status

class RateLimiter:
    """Sliding-window rate limiter per key (e.g., customer IP, session ID, or phone)."""
    def __init__(self, limit: int = 60, window_seconds: int = 60):
        self.limit = limit
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = {}
        self.lock = threading.Lock()

    def check(self, key: str) -> bool:
        now = time.time()
        with self.lock:
            timestamps = self.requests.get(key, [])
            # Filter out requests older than window_seconds
            timestamps = [t for t in timestamps if now - t < self.window_seconds]
            if len(timestamps) >= self.limit:
                self.requests[key] = timestamps
                return False
            timestamps.append(now)
            self.requests[key] = timestamps
            return True

limiter = RateLimiter(limit=60, window_seconds=60)

def enforce_rate_limit(key: str):
    if not limiter.check(key):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {limiter.limit} requests per minute allowed."
        )
