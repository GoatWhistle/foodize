from slowapi import Limiter
from slowapi.util import get_remote_address

# NOTE: get_remote_address trusts the socket peer address as-is. If this service runs
# behind a reverse proxy (nginx, load balancer) that terminates client connections and
# forwards X-Forwarded-For/X-Real-IP, get_remote_address will see the proxy's IP for
# every request unless Starlette/uvicorn is configured with a trusted proxy list
# (proxy_headers=True + forwarded_allow_ips), which would make every client share one
# rate-limit bucket, or — if trusted blindly — let clients spoof X-Forwarded-For to
# bypass rate limiting entirely. Verify prod proxy topology and configure a trusted
# proxy allowlist before relying on this limiter as a real anti-brute-force control.
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
