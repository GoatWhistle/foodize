# Деплой Foodize на сервер (Web + Telegram-бот)

Гайд под конкретную конфигурацию:

- **Публично на домене:** только web-приложение на корне домена (`https://example.com`).
- **Reverse-proxy / HTTPS:** nginx + certbot (Let's Encrypt) на хосте.
- **Хранилище фото:** внешний S3 (AWS S3 / Cloudflare R2 / Backblaze B2 и т.п.).
- **Telegram-бот:** режим `webhook`.

> Везде замени `example.com` на свой домен, а `<SERVER_IP>` — на IP сервера.

Схема трафика:

```
Интернет ──HTTPS──▶ nginx (хост, :443)
                      ├── /            ─▶ 127.0.0.1:5173  (web-фронт, контейнер nginx)
                      │                     └── /api/v1/  ─▶ backend:8000  (проксирует сам фронт)
                      └── /webhook      ─▶ 127.0.0.1:8080  (telegram-bot, webhook)
```

Внутренние сервисы (Postgres, Redis, RabbitMQ, backend, worker) слушают только `127.0.0.1` и наружу не выходят.

---

## 0. Что понадобится

- VPS: **2 vCPU / 4 GB RAM** минимум (сумма лимитов контейнеров ≈ 2.8 GB + запас), 20+ GB диска. ОС — Ubuntu 22.04/24.04.
- Домен `example.com` (уже куплен) с доступом к DNS.
- Токен бота от [@BotFather](https://t.me/BotFather).
- Аккаунт внешнего S3 и созданный бакет с публичным чтением объектов.
- (Опционально) ключ LLM-провайдера для AI-советника и Sentry DSN для ошибок.

---

## 1. DNS

Создай A-запись на IP сервера:

| Тип | Имя | Значение     |
|-----|-----|--------------|
| A   | `@` (example.com) | `<SERVER_IP>` |
| A   | `www` (опц.)      | `<SERVER_IP>` |

Проверь, что резолвится (может занять до нескольких часов):

```bash
dig +short example.com
```

---

## 2. Подготовка сервера

```bash
# Обновление и базовые пакеты
sudo apt update && sudo apt upgrade -y
sudo apt install -y git make ufw curl

# Docker + Compose plugin (официальный скрипт)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker   # или перелогинься

# Firewall: наружу только SSH + HTTP + HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Порты `8000/5173/8080/5432/...` наружу открывать **не нужно** — они привязаны к `127.0.0.1`.

---

## 3. Клонирование проекта

```bash
cd /opt
sudo git clone <URL_РЕПОЗИТОРИЯ> foodize
sudo chown -R $USER:$USER foodize
cd foodize
```

---

## 4. JWT-ключи (обязательно!)

Ключи для авторизации лежат в `src/backend/certs/` и **не хранятся в git**. Их надо сгенерировать до сборки образа — иначе backend не поднимется.

```bash
make keys
# создаст src/backend/certs/jwt-private.pem и jwt-public.pem
```

Ключи попадут в образ backend при сборке (`COPY . .`). Файл `jwt-private.pem` — секрет, не коммить.

---

## 5. Внешний S3 (фото блюд)

1. Создай бакет, например `foodize-media`.
2. Включи **публичное чтение объектов** (анонимный GET) — фото отдаются напрямую в `<img>`.
3. Создай access key / secret key с правами на этот бакет.
4. Запиши для себя:
   - **Endpoint** (для backend): у AWS S3 оставь пустым; у R2/B2/прочих — их S3-endpoint (напр. `https://<accountid>.r2.cloudflarestorage.com`).
   - **Public base URL** (для браузера): публичный адрес бакета, напр.
     - AWS: `https://foodize-media.s3.eu-central-1.amazonaws.com`
     - R2 (public bucket): `https://pub-xxxx.r2.dev`
     - + `/foodize-media` в конце, если провайдер отдаёт по пути `<endpoint>/<bucket>`.

Значения пойдут в `.env` (шаг 6, блок S3).

---

## 6. Заполнение `.env` (production)

Скопируй пример и правь под прод:

```bash
cp .env.example .env
```

Сгенерируй сильные секреты (каждый — отдельной командой):

```bash
openssl rand -hex 32   # для POSTGRES_PASSWORD
openssl rand -hex 32   # для REDIS_PASSWORD
openssl rand -hex 32   # для RABBITMQ_PASS
openssl rand -hex 32   # для TELEGRAM__BOT_API_SECRET
openssl rand -hex 32   # для BOT_WEBHOOK_SECRET
```

> Используй **буквенно-цифровые** пароли (hex) — они не ломают строки подключения `DB__URL`/`RABBITMQ__URL`. Спецсимволы пришлось бы URL-кодировать.

Ниже — что именно должно быть в `.env`. Значения `<...>` подставь свои.

```dotenv
# ── Runtime ────────────────────────────────────────────────
RUN__HOST=0.0.0.0
RUN__PORT=8000
DEBUG=false                       # ⚠️ обязательно false в проде
LOGS__LEVEL=INFO
LOGS__ENVIRONMENT=production       # ⚠️ было development
LOGS__SENTRY_DSN=                  # опционально: DSN проекта Sentry

# ── PostgreSQL ─────────────────────────────────────────────
POSTGRES_DB=foodize
POSTGRES_USER=foodize_user
POSTGRES_PASSWORD=<PG_PASS>
DB__URL=postgresql+asyncpg://foodize_user:<PG_PASS>@pg:5432/foodize   # креды ДОЛЖНЫ совпадать с тремя строками выше
DB__ECHO=false
DB__ECHO_POOL=false
DB__POOL_SIZE=10
DB__MAX_OVERFLOW=10

# ── Redis ──────────────────────────────────────────────────
REDIS_PASSWORD=<REDIS_PASS>       # ⚠️ при DEBUG=false пустой пароль -> backend падает
REDIS__URL=redis://:<REDIS_PASS>@redis:6379/0

# ── RabbitMQ ───────────────────────────────────────────────
RABBITMQ_USER=foodize
RABBITMQ_PASS=<RABBIT_PASS>       # ⚠️ дефолт foodize:foodize запрещён в проде
RABBITMQ_VHOST=foodize
RABBITMQ__URL=amqp://foodize:<RABBIT_PASS>@rabbitmq:5672/foodize

# ── CORS ───────────────────────────────────────────────────
CORS__ALLOWED_ORIGINS=["https://example.com"]

# ── Auth (можно оставить дефолт) ───────────────────────────
AUTH__ACCESS_TOKEN_LIFETIME_SECONDS=1800
AUTH__REFRESH_TOKEN_LIFETIME_SECONDS=2592000

# ── Telegram bot ───────────────────────────────────────────
BOT_TOKEN=<ТОКЕН_ОТ_BOTFATHER>
BOT_USERNAME=FoodizeBot
MINI_APP_URL=                                 # только-web: оставь пустым
TELEGRAM__BOT_API_SECRET=<BOT_API_SECRET>     # ⚠️ сильный, не из списка weak
BOT_MODE=webhook                              # ⚠️ было polling
BOT_WEBHOOK_URL=https://example.com           # без /webhook — бот сам добавит
BOT_WEBHOOK_SECRET=<WEBHOOK_SECRET>           # ⚠️ обязателен при webhook

# Backend читает токен/имя из этих (оставь как есть — берутся из BOT_*)
TELEGRAM__BOT_TOKEN=${BOT_TOKEN}
TELEGRAM__BOT_USERNAME=${BOT_USERNAME}
TELEGRAM__MINI_APP_URL=${MINI_APP_URL}

# ── LLM (опционально) ──────────────────────────────────────
LLM__PROVIDER=openai
LLM__OPENAI_API_KEY=<КЛЮЧ или пусто>          # пусто -> AI-советник недоступен, остальное работает
LLM__OPENAI_BASE_URL=https://openrouter.ai/api/v1
LLM__OPENAI_MODEL=cohere/north-mini-code:free
LLM__EMBEDDINGS_ENABLED=false                 # без локального Ollama на сервере — выключи (будет keyword-поиск)

# ── Внешний S3 (двойное подчёркивание — их читает backend) ─
S3__ENDPOINT_URL=<S3_ENDPOINT или пусто для AWS>
S3__REGION=<напр. eu-central-1>
S3__ACCESS_KEY=<S3_ACCESS_KEY>
S3__SECRET_KEY=<S3_SECRET_KEY>
S3__BUCKET=foodize-media
S3__PUBLIC_BASE_URL=https://<публичный-адрес-бакета>
```

> Переменные `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `GRAFANA_ADMIN_PASSWORD`, `POSTGRES_IMAGE_TAG` и т.п. нужны только локальному MinIO/мониторингу — при внешнем S3 их можно не трогать. Backend берёт S3 из `S3__*`.
>
> `VITE_*` из `.env` фронтом **не используются** при сборке в Docker — они задаются отдельно, см. шаг 7.

---

## 7. Сборочная конфигурация web-фронта

Фронт по умолчанию обращается к `http://localhost:8000/api/v1` (`import.meta.env.VITE_API_URL`), а Docker-сборка build-аргументы не прокидывает. Чтобы в проде фронт ходил на тот же домен (nginx фронта сам проксирует `/api/v1` → backend), создай файл, который Vite подхватывает автоматически при `npm run build`:

```bash
cat > src/frontend/.env.production <<'EOF'
VITE_API_URL=/api/v1
VITE_WEB_URL=https://example.com
VITE_BOT_USERNAME=FoodizeBot
VITE_MINI_APP_URL=
EOF
```

`VITE_API_URL=/api/v1` — относительный путь: браузер шлёт запрос на тот же origin, nginx фронта проксирует на backend. Так не нужен отдельный API-домен и не будет CORS.

---

## 8. Проброс порта бота для webhook

В `docker-compose.prod.yaml` у сервиса `telegram-bot` **нет** проброса порта, а для webhook он нужен. Добавь маппинг на loopback (nginx с хоста дотянется):

```yaml
  telegram-bot:
    # ... остальное без изменений ...
    ports:
      - "127.0.0.1:8080:8080"
```

Бот при старте сам вызовет `setWebhook` на `https://example.com/webhook` (из `BOT_WEBHOOK_URL`) и проверит секрет `BOT_WEBHOOK_SECRET`.

---

## 9. Сборка и запуск контейнеров

Только нужные сервисы (miniapp не деплоим — режим «только web»):

```bash
docker compose -f docker-compose.prod.yaml up -d --build \
  pg redis rabbitmq migrations backend worker frontend telegram-bot
```

- `migrations` прогонит Alembic автоматически (backend ждёт её успешного завершения).
- Проверь статусы (все должны стать `healthy`/`running`):

```bash
docker compose -f docker-compose.prod.yaml ps
docker compose -f docker-compose.prod.yaml logs -f backend telegram-bot
```

Быстрая проверка backend изнутри хоста:

```bash
curl -s http://127.0.0.1:8000/api/health
curl -s http://127.0.0.1:5173/          # отдаёт index.html фронта
```

---

## 10. nginx + certbot на хосте

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Создай сайт `/etc/nginx/sites-available/foodize`:

```nginx
server {
    listen 80;
    server_name example.com www.example.com;

    client_max_body_size 15m;   # загрузка фото блюд

    # Telegram webhook -> контейнер бота
    location /webhook {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # проброс секретного заголовка Telegram (nginx и так его передаёт)
    }

    # Всё остальное -> web-фронт (он сам проксирует /api/v1 на backend)
    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;      # WebSocket для уведомлений
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
    }
}
```

Активируй и выпусти сертификат:

```bash
sudo ln -s /etc/nginx/sites-available/foodize /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Let's Encrypt: certbot сам добавит 443, сертификат и редирект 80->443
sudo certbot --nginx -d example.com -d www.example.com
```

Автопродление сертификата уже настроено таймером certbot; проверить:

```bash
sudo certbot renew --dry-run
```

---

## 11. Настройка Telegram

1. В [@BotFather](https://t.me/BotFather) убедись, что токен активен (`/mybots` → твой бот).
2. Перезапусти бота, чтобы он выставил webhook (если менял `.env` после старта):
   ```bash
   docker compose -f docker-compose.prod.yaml up -d telegram-bot
   ```
3. Проверь, что Telegram принял webhook (подставь свой `BOT_TOKEN`):
   ```bash
   curl -s "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
   ```
   В ответе `"url": "https://example.com/webhook"` и `"pending_update_count"` не растёт, `last_error_message` пуст.
4. Напиши боту `/start` — должен ответить.

---

## 12. Smoke-тест

- [ ] `https://example.com` открывается по HTTPS, замок валидный.
- [ ] Регистрация/логин работают (значит JWT-ключи на месте, CORS ок).
- [ ] Меню/рестораны грузятся (запросы идут на `https://example.com/api/v1/...` со статусом 200).
- [ ] Загрузка фото блюда сохраняется и картинка отображается с `S3__PUBLIC_BASE_URL`.
- [ ] Бот отвечает на `/start`, приходят уведомления (WebSocket `/api/v1/ws/`).
- [ ] `getWebhookInfo` без ошибок.

---

## 13. Эксплуатация

```bash
# Логи
docker compose -f docker-compose.prod.yaml logs -f --tail=200 backend

# Бэкап БД (скрипт в tools/backup.sh; проверь PG_CONTAINER)
bash tools/backup.sh
# Восстановление
bash tools/restore.sh <файл.dump>

# Обновление после git pull
git pull
make keys        # no-op, если ключи уже есть
docker compose -f docker-compose.prod.yaml up -d --build \
  backend worker frontend telegram-bot
```

Обновления фронта требуют пересборки (`--build frontend`), т.к. URL зашиты на этапе сборки.

### ⚠️ Переход на pgvector (при следующем деплое)

Основная БД переехала с `postgres:17-alpine` на `pgvector/pgvector:pg17` (Debian). Мажорная
версия PostgreSQL та же, данные в volume совместимы, но alpine (musl) и Debian (glibc)
по-разному реализуют collation — текстовые индексы (в т.ч. trgm) могут стать некорректными.
Порядок при деплое:

```bash
# 1. добавить в .env: PGVECTOR_IMAGE_TAG=pg17
# 2. перезапустить БД на новом образе
docker compose -f docker-compose.prod.yaml up -d pg
# 3. пересобрать текстовые индексы (однократно)
docker compose -f docker-compose.prod.yaml exec pg \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c 'REINDEX DATABASE;'
# 4. накатить миграции (создаст extension vector и menu_item_embeddings)
docker compose -f docker-compose.prod.yaml up -d --build backend worker
```

### Мониторинг (опционально)

```bash
# требует GRAFANA_ADMIN_PASSWORD и POSTGRES_* в .env
docker compose -f docker-compose.monitoring.yml up -d
# Grafana на 127.0.0.1:3000 — пробрось через SSH-туннель, наружу не открывай
ssh -L 3000:127.0.0.1:3000 user@<SERVER_IP>
```

---

## 14. Чек-лист безопасности перед публикацией

- [ ] `DEBUG=false`, `LOGS__ENVIRONMENT=production`.
- [ ] Все пароли/секреты заменены на `openssl rand -hex 32` (PG, Redis, RabbitMQ, `TELEGRAM__BOT_API_SECRET`, `BOT_WEBHOOK_SECRET`).
- [ ] `.env` и `src/backend/certs/*.pem` не в git (проверь `git status`).
- [ ] `CORS__ALLOWED_ORIGINS` = только твой домен.
- [ ] Наружу открыты только 22/80/443 (`sudo ufw status`).
- [ ] S3-бакет: публичный только на чтение, ключи с минимальными правами.
- [ ] Сертификат Let's Encrypt валиден и автопродляется.
