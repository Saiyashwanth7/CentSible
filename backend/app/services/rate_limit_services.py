from app.core.redis import redis_client


async def check_rate_limit(key: str, limit: int, window_seconds: int) -> bool:
    count = await redis_client.incr(key)
    if count == 1:
        await redis_client.expire(key, window_seconds)
    return count <= limit


async def reset_rate_limit(key):
    await redis_client.delete(key)
