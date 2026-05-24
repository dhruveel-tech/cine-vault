import os
import random


def get_proxy() -> str | None:
    raw = os.getenv("PROXY_LIST", "").strip()
    if not raw:
        return None
    proxies = [proxy.strip() for proxy in raw.split(",") if proxy.strip()]
    return random.choice(proxies) if proxies else None
