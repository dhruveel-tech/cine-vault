const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

type CacheOptions = {
  ttlSeconds?: number;
};

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;
  return { url, token };
}

async function getFromUpstash<T>(key: string): Promise<T | null> {
  const config = getUpstashConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${config.token}` },
      cache: "no-store"
    });

    if (!response.ok) return null;
    const payload = await response.json();
    if (!payload?.result) return null;

    return JSON.parse(payload.result) as T;
  } catch {
    return null;
  }
}

async function setInUpstash(key: string, value: unknown, ttlSeconds: number) {
  const config = getUpstashConfig();
  if (!config) return;

  try {
    await fetch(`${config.url}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(value))}?EX=${ttlSeconds}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.token}` },
      cache: "no-store"
    });
  } catch {
    // Cache must never break a request. MongoDB remains the source of truth.
  }
}

function getFromMemory<T>(key: string): T | null {
  const cached = memoryCache.get(key);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }

  return cached.value as T;
}

function setInMemory(key: string, value: unknown, ttlSeconds: number) {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000
  });
}

export async function getCached<T>(key: string): Promise<T | null> {
  const memoryValue = getFromMemory<T>(key);
  if (memoryValue) return memoryValue;

  const redisValue = await getFromUpstash<T>(key);
  if (redisValue) {
    setInMemory(key, redisValue, 30);
    return redisValue;
  }

  return null;
}

export async function setCached(key: string, value: unknown, options: CacheOptions = {}) {
  const ttlSeconds = options.ttlSeconds ?? 3600;
  setInMemory(key, value, ttlSeconds);
  await setInUpstash(key, value, ttlSeconds);
}

export async function cached<T>(key: string, loader: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
  const existing = await getCached<T>(key);
  if (existing) return existing;

  const value = await loader();
  await setCached(key, value, options);
  return value;
}
