from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from infra.cache.redis import RedisCache


def _make_cache():
    client = AsyncMock()
    return RedisCache(client), client


@pytest.mark.asyncio
async def test_get():
    cache, client = _make_cache()
    client.get = AsyncMock(return_value="value")
    result = await cache.get("key")
    assert result == "value"


@pytest.mark.asyncio
async def test_set_with_ttl():
    cache, client = _make_cache()
    client.set = AsyncMock()
    await cache.set("key", "val", ttl=60)
    client.set.assert_awaited_once_with("key", "val", ex=60)


@pytest.mark.asyncio
async def test_delete():
    cache, client = _make_cache()
    client.delete = AsyncMock()
    await cache.delete("key")
    client.delete.assert_awaited_once_with("key")


@pytest.mark.asyncio
async def test_exists_true():
    cache, client = _make_cache()
    client.exists = AsyncMock(return_value=1)
    assert await cache.exists("key") is True


@pytest.mark.asyncio
async def test_exists_false():
    cache, client = _make_cache()
    client.exists = AsyncMock(return_value=0)
    assert await cache.exists("key") is False


@pytest.mark.asyncio
async def test_set_nx_true():
    cache, client = _make_cache()
    client.set = AsyncMock(return_value=True)
    result = await cache.set_nx("key", "val", ttl=30)
    assert result is True


@pytest.mark.asyncio
async def test_set_nx_false():
    cache, client = _make_cache()
    client.set = AsyncMock(return_value=None)
    result = await cache.set_nx("key", "val")
    assert result is False


@pytest.mark.asyncio
async def test_sadd():
    cache, client = _make_cache()
    client.sadd = AsyncMock()
    await cache.sadd("key", "a", "b")
    client.sadd.assert_awaited_once_with("key", "a", "b")


@pytest.mark.asyncio
async def test_expire():
    cache, client = _make_cache()
    client.expire = AsyncMock()
    await cache.expire("key", 300)
    client.expire.assert_awaited_once_with("key", 300)


@pytest.mark.asyncio
async def test_smembers():
    cache, client = _make_cache()
    client.smembers = AsyncMock(return_value={"a", "b"})
    result = await cache.smembers("key")
    assert result == {"a", "b"}


@pytest.mark.asyncio
async def test_delete_many_with_keys():
    cache, client = _make_cache()
    client.delete = AsyncMock()
    await cache.delete_many("k1", "k2")
    client.delete.assert_awaited_once_with("k1", "k2")


@pytest.mark.asyncio
async def test_delete_many_empty():
    cache, client = _make_cache()
    client.delete = AsyncMock()
    await cache.delete_many()
    client.delete.assert_not_awaited()


@pytest.mark.asyncio
async def test_mget_empty():
    cache, client = _make_cache()
    result = await cache.mget()
    assert result == []
    client.mget.assert_not_awaited()


@pytest.mark.asyncio
async def test_mget_with_keys():
    cache, client = _make_cache()
    client.mget = AsyncMock(return_value=["v1", None])
    result = await cache.mget("k1", "k2")
    assert result == ["v1", None]


@pytest.mark.asyncio
async def test_mset_empty():
    cache, client = _make_cache()
    await cache.mset({})


@pytest.mark.asyncio
async def test_mset_with_data():
    cache, client = _make_cache()
    mock_pipe = AsyncMock()
    mock_pipe.__aenter__ = AsyncMock(return_value=mock_pipe)
    mock_pipe.__aexit__ = AsyncMock(return_value=False)
    mock_pipe.set = MagicMock()
    mock_pipe.execute = AsyncMock()
    client.pipeline = MagicMock(return_value=mock_pipe)

    await cache.mset({"k1": "v1", "k2": "v2"}, ttl=10)
    mock_pipe.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_publish():
    cache, client = _make_cache()
    client.publish = AsyncMock()
    await cache.publish("channel", "msg")
    client.publish.assert_awaited_once_with("channel", "msg")


@pytest.mark.asyncio
async def test_sadd_with_expire():
    cache, client = _make_cache()
    mock_pipe = AsyncMock()
    mock_pipe.__aenter__ = AsyncMock(return_value=mock_pipe)
    mock_pipe.__aexit__ = AsyncMock(return_value=False)
    mock_pipe.sadd = MagicMock()
    mock_pipe.expire = MagicMock()
    mock_pipe.execute = AsyncMock()
    client.pipeline = MagicMock(return_value=mock_pipe)

    await cache.sadd_with_expire("tag_key", "cache_key", 300)

    mock_pipe.sadd.assert_called_once_with("tag_key", "cache_key")
    mock_pipe.expire.assert_called_once_with("tag_key", 300)
    mock_pipe.execute.assert_awaited_once()


def test_get_raw_client():
    client = MagicMock()
    cache = RedisCache(client)
    assert cache.get_raw_client() is client


@pytest.mark.asyncio
async def test_incr_with_expire_sets_ttl_on_first_hit():
    cache, client = _make_cache()
    client.incr = AsyncMock(return_value=1)
    client.expire = AsyncMock()
    result = await cache.incr_with_expire("key", 60)
    assert result == 1
    client.expire.assert_awaited_once_with("key", 60)


@pytest.mark.asyncio
async def test_incr_with_expire_skips_ttl_after_first_hit():
    cache, client = _make_cache()
    client.incr = AsyncMock(return_value=2)
    client.expire = AsyncMock()
    result = await cache.incr_with_expire("key", 60)
    assert result == 2
    client.expire.assert_not_awaited()
