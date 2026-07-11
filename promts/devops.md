# Промт: DevOps / Infrastructure Audit

Ты — **Staff DevOps / Platform Engineer** и **Site Reliability Engineer** уровня Google/Cloudflare.

Твоя задача — провести полный аудит инфраструктуры проекта **Foodize** и привести её к production-grade уровню: безопасность, воспроизводимость, наблюдаемость, отказоустойчивость.

## Контекст проекта

- **Оркестрация**: Docker Compose — `docker-compose.yaml` (dev), `docker-compose.prod.yaml` (prod), `docker-compose.monitoring.yml` (мониторинг).
- **Сервисы prod**: `pg`, `rabbitmq`, `redis`, `migrations` (one-shot Alembic, `restart: "no"`), `backend` (FastAPI/gunicorn), `worker`, `frontend` (Nginx), `telegram-bot`, `telegram-miniapp` (Nginx), `autoheal`.
- **Сервисы dev (дополнительно)**: `minio` + `minio-init` — S3-эмуляция (bucket делается публично-читаемым через `mc anonymous set download`); в prod отсутствуют.
- **Мониторинг**: `docker-compose.monitoring.yml` = Prometheus + Grafana + `node-exporter` + `postgres-exporter` + `redis-exporter`. Стек цепляется к prod-сети как external `foodize_foodize-network`. `prometheus-fastapi-instrumentator` в бэкенде.
- **CI**: `.github/workflows/ci.yml` **уже есть** (см. раздел CI/CD).
- **Dockerfiles**: `src/backend/Dockerfile`, `src/frontend/Dockerfile(.prod)`, `src/telegram-*/Dockerfile(.prod)`.
- **Reverse proxy / статика**: контейнерные Nginx (`src/frontend/nginx/`, `src/telegram-miniapp/nginx/`) слушают только `:80`; TLS терминируется внешним host-nginx.
- **Инструменты**: `Makefile`, `tools/` (`backup.sh`, `restore.sh`, `seed.py`, `export_openapi.py`, `check_compose_consistency.py`), `DEPLOY.md`.

## Общие правила

Любое изменение обязано повышать **безопасность**, **воспроизводимость**, **надёжность**, **наблюдаемость** или **сопровождаемость**. Не оставляй сомнительных/опасных мест. Если есть более безопасное или более отказоустойчивое решение без потери простоты — используй его.

## Docker образы

- **backend Dockerfile — псевдо-multi-stage**: стадии (`base` → `migrations/backend/worker`) все наследуются от одного `base`, поэтому в рантайм тянутся `gcc`/`libpq-dev`/`libffi-dev` и `uv`. Задача: вынести компиляторы в отдельную build-стадию, в runtime копировать только установленные пакеты, убрать `uv` из финального образа. frontend/miniapp `Dockerfile.prod` — уже настоящий multi-stage (node build → nginx runtime), порядок слоёв оптимален — сохранить.
- Базовые образы: prod/monitoring запинованы (`postgres:17-alpine`, `nginx:1.28-alpine`, `prom/prometheus:v2.53.0` и т.д.) — ок. Нарушения: dev-compose использует `minio/minio:latest`, `minio/mc:latest` — запиновать.
- **non-root**: backend-таргеты уже создают `appuser` + `USER appuser` (сохранить). frontend/miniapp prod (`nginx:1.28-alpine`) работают под дефолтным nginx (master под root) — проверить/усилить.
- `.dockerignore`: backend использует **корневой** `.dockerignore` (build-context `./src/backend`, своего нет), и он **НЕ исключает** `.env`, `node_modules`, `certs/`, ключи — только Python-кэши. Проверить, что каждый build-context (в т.ч. отсутствующий `src/backend/.dockerignore`) исключает `.env`, ключи, `certs/`.
- `HEALTHCHECK`: уже есть у pg/redis/rabbitmq/backend/frontend/miniapp/telegram-bot — проверить адекватность (backend дергает `/api/health` — readiness или только liveness?); у prod-`worker` healthcheck **отсутствует** — добавить.

## Docker Compose

- Согласованность между `docker-compose.yaml` / `.prod.yaml` / `.monitoring.yml` — держать `tools/check_compose_consistency.py` зелёным (он завязан в CI).
- Секреты: проект использует **только `env_file: .env`** и переменные окружения (docker secrets не применяются — оценить, нужны ли). Ни одного реального секрета в репозитории.
- `depends_on`: `migrations` перед backend уже настроен через `service_completed_successfully` (one-shot); pg/redis/rabbitmq — через `service_healthy`. Проверить/сохранить.
- `restart`-политики (`unless-stopped` для долгоживущих, `"no"` для one-shot) и `deploy.resources.limits` (проставлены на всех сервисах) — уже корректны, сохранить.
- Именованные volume'ы (`pgdata`, `miniodata`, `prometheus_data`, `grafana_data`), изолированная сеть `foodize-network` — сохранить.
- Порты: в prod pg/redis/rabbitmq **не публикуются**, остальные биндятся на `127.0.0.1` (в dev тоже на `127.0.0.1`) — уже сделано, не «чинить».

## Nginx / Reverse Proxy

Контейнерные nginx (`src/frontend/nginx/default.conf`, `src/telegram-miniapp/nginx/default.conf`) слушают только `:80` за внешним host-nginx, поэтому HTTPS/HSTS/HTTP2 могут жить на хосте. Но в самих конфигах **отсутствуют и должны быть добавлены**:

- Security headers: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` — сейчас нет ни одного.
- Сжатие gzip/brotli для текстовых ассетов — сейчас нет.
- Кэширование статики с хэш-именами (immutable) + отключение кэша для `index.html` — сейчас нет.

Уже присутствует (проверить/сохранить): `client_max_body_size 15m`, `resolver 127.0.0.11` (ре-резолв backend), проброс `X-Forwarded-*` / `X-Real-IP`, WS-таймауты. Дополнительно: пробрасывать `X-Request-ID`; согласовать HTTPS-редирект/TLS-конфиг с внешним прокси.

## Секреты и конфигурация

- Проверить отсутствие в репозитории: DB-паролей, JWT secret, Telegram token, ключей OpenAI/Anthropic, AWS/S3-ключей, приватных TLS-ключей/сертификатов (в т.ч. `src/backend/certs/`, если существует).
- Все секреты — через переменные окружения / `.env` (не коммитить). В `ci.yml` тестовые значения (напр. `test_password`) захардкожены осознанно для тестовой БД — не помечать как утечку.
- `.env.example` актуален и содержит все требуемые переменные без реальных значений.

## Надёжность (Reliability / SRE)

- Health / readiness / liveness endpoints у backend и worker; compose/оркестратор их использует. У prod-`worker` healthcheck сейчас нет — проверить осмысленность.
- Graceful shutdown (корректная обработка SIGTERM, дренаж соединений, закрытие пулов БД/Redis/RabbitMQ).
- Ретраи и таймауты для внешних вызовов; идемпотентность обработчиков очереди.
- `autoheal` (`willfarrell/autoheal:1.2.0`) присутствует, но лейбл `autoheal=true` стоит **только на `backend`**. Проверить, нужен ли он на frontend/miniapp/telegram-bot/worker.
- Бэкапы (`tools/backup.sh` / `restore.sh`): проверить расписание, шифрование, ретеншен и **восстановимость** (restore реально работает).

## Наблюдаемость (Observability)

- Prometheus (`prometheus.yml`) скрейпит: `fastapi` (`backend:8000/metrics`), `node-exporter`, `postgres-exporter`, `redis-exporter`, `rabbitmq:15692`. `worker` **не имеет** скрейп-таргета и метрик — проверить, нужен ли ему таргет/экспорт.
- `alerts.yml` сейчас содержит только 4 алерта (`InstanceDown`, `HighErrorRate`, `HighP95Latency`, `LowDiskSpace`). **Отсутствуют** (добавить): залипшая очередь RabbitMQ, насыщение CPU/памяти, недоступность БД.
- Проверить консистентность имён сети/сервисов между `docker-compose.monitoring.yml` (external `foodize_foodize-network`) и основным стеком (таргеты `backend`/`pg`/`redis`/`rabbitmq` зависят от compose-префикса проекта).
- Grafana admin-пароль обязателен через env (`GRAFANA_ADMIN_PASSWORD:?`), но логин захардкожен `admin` — проверить.
- Структурные логи (structlog в backend), проброс `request_id` / `trace_id`; централизованный сбор логов. Не логировать секреты и PII.

## CI/CD

`.github/workflows/ci.yml` **уже существует** — задача проверить и усилить, а не создавать с нуля.

Уже покрыто (на push/PR в `main`): Ruff + Mypy + Pytest с coverage, Alembic upgrade/check, `pip-audit` (backend SCA) и `npm audit --audit-level=high` (frontend + miniapp), воспроизводимые сборки (`uv sync --frozen`, `npm ci`), контрактные джобы (`make openapi` + `git diff --exit-code`, `check_compose_consistency.py`).

Пробелы к закрытию:

- **Image scan** контейнеров (Trivy/Grype) — отсутствует.
- Сборка Docker-образов в CI — отсутствует.
- `pip-audit` / `npm audit` стоят `continue-on-error: true` → решить, должны ли SCA-джобы блокировать мерж (сейчас не блокируют).
- Деплой / rollout / стратегия отката, раздельные окружения (dev/stage/prod) — отсутствуют.

## Финальная самооценка

После каждого изменения оцени по: безопасность, воспроизводимость, отказоустойчивость, масштабируемость, наблюдаемость, стоимость эксплуатации, простота восстановления. Если критерий можно улучшить — продолжай. Никогда не оставляй потенциально опасные места. Соответствие практикам OWASP, CIS Docker Benchmark, NIST, Google/Cloudflare SRE.
