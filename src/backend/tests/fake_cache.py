import builtins

from infra.cache.base import CacheRepository


class FakeCache(CacheRepository):
    def __init__(self) -> None:
        self.store: dict[str, str] = {}
        self.sets: dict[str, builtins.set[str]] = {}

    async def get(self, key: str) -> str | None:
        return self.store.get(key)

    async def set(self, key: str, value: str, ttl: int | None = None) -> None:
        del ttl
        self.store[key] = value

    async def delete(self, key: str) -> None:
        self.store.pop(key, None)

    async def exists(self, key: str) -> bool:
        return key in self.store

    async def set_nx(self, key: str, value: str, ttl: int | None = None) -> bool:
        del ttl
        if key in self.store:
            return False
        self.store[key] = value
        return True

    async def sadd(self, key: str, *values: str) -> None:
        self.sets.setdefault(key, set()).update(values)

    async def smembers(self, key: str) -> builtins.set[str]:
        return builtins.set(self.sets.get(key, builtins.set()))

    async def delete_many(self, *keys: str) -> None:
        for key in keys:
            self.store.pop(key, None)

    async def mget(self, *keys: str) -> list[str | None]:
        return [self.store.get(key) for key in keys]

    async def mset(self, mapping: dict[str, str], ttl: int | None = None) -> None:
        del ttl
        self.store.update(mapping)

    async def expire(self, key: str, ttl: int) -> None:
        del key, ttl

    async def sadd_with_expire(self, key: str, value: str, ttl: int) -> None:
        del ttl
        self.sets.setdefault(key, set()).add(value)

    async def incr_with_expire(self, key: str, ttl: int) -> int:
        del ttl
        current = int(self.store.get(key, "0")) + 1
        self.store[key] = str(current)
        return current
