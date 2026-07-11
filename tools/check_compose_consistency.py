from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE_FILE = ROOT / "docker-compose.yaml"
PROD_FILE = ROOT / "docker-compose.prod.yaml"

KNOWN_DEV_PROD_DIVERGENCE = {
    "frontend": "dev runs Vite dev server on 5173, prod serves via nginx on port 80",
    "telegram-miniapp": "dev runs Vite dev server on 5174, prod serves via nginx on port 80",
}

REQUIRED_ENV_STUBS = {
    "POSTGRES_DB": "stub_db",
    "POSTGRES_USER": "stub_user",
    "POSTGRES_PASSWORD": "stub_password",
    "RABBITMQ_USER": "stub_user",
    "RABBITMQ_PASS": "stub_pass",
    "RABBITMQ_VHOST": "/",
    "REDIS_PASSWORD": "stub_password",
    "DB__URL": "postgresql+asyncpg://stub_user:stub_password@pg:5432/stub_db",
    "RABBITMQ__URL": "amqp://stub_user:stub_pass@rabbitmq:5672/",
    "BOT_TOKEN": "0000000000:stub-token-stub-token-stub-tok",
    "S3_ACCESS_KEY": "stub_access_key",
    "S3_SECRET_KEY": "stub_secret_key",
}


def load_config(compose_file: Path) -> dict:
    env = {**REQUIRED_ENV_STUBS}
    result = subprocess.run(
        ["docker", "compose", "-f", str(compose_file), "config", "--format", "json"],
        cwd=ROOT,
        env={**_current_env(), **env},
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        print(f"Failed to parse {compose_file.name}:\n{result.stderr}", file=sys.stderr)
        sys.exit(1)
    return json.loads(result.stdout)


def _current_env() -> dict:
    import os

    return dict(os.environ)


def healthcheck_path(healthcheck: dict | None) -> str | None:
    if not healthcheck:
        return None
    test = healthcheck.get("test") or []
    joined = " ".join(test)
    for token in test:
        if isinstance(token, str) and ("://" in token or token.startswith("/")):
            return token
    return joined or None


def main() -> int:
    base = load_config(BASE_FILE)
    prod = load_config(PROD_FILE)

    base_services = base.get("services", {})
    prod_services = prod.get("services", {})

    common = sorted(set(base_services) & set(prod_services))
    problems: list[str] = []

    for name in common:
        if name in KNOWN_DEV_PROD_DIVERGENCE:
            continue

        b = base_services[name]
        p = prod_services[name]

        b_health = healthcheck_path(b.get("healthcheck"))
        p_health = healthcheck_path(p.get("healthcheck"))
        if b_health and p_health and b_health != p_health:
            problems.append(
                f"[{name}] healthcheck target differs: base={b_health!r} prod={p_health!r}"
            )

        b_ports = {p_["target"] for p_ in b.get("ports", [])}
        p_ports = {p_["target"] for p_ in p.get("ports", [])}
        if b_ports and p_ports and b_ports != p_ports:
            problems.append(
                f"[{name}] published container ports differ: base={sorted(b_ports)} prod={sorted(p_ports)}"
            )

        b_image = b.get("image")
        p_image = p.get("image")
        if b_image and p_image and b_image != p_image:
            problems.append(f"[{name}] image differs: base={b_image!r} prod={p_image!r}")

    if problems:
        print("docker-compose.yaml and docker-compose.prod.yaml have diverged:")
        for problem in problems:
            print(f"  - {problem}")
        print(
            "\nIf this divergence is intentional, update this script's exceptions. "
            "Otherwise reconcile the two compose files so common services stay consistent."
        )
        return 1

    print(f"OK: {len(common)} common services consistent between base and prod compose files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
