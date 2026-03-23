# Деплой: чеклист

## Что уже есть

| Компонент | Статус |
|-----------|--------|
| Node backend (Express, `npm run build`) | Готов |
| Python model service (FastAPI, CrabNet + lazy RF) | Готов |
| `docker/model-service.Dockerfile` (контекст — **корень репо**) | Готов |
| `docker/backend.Dockerfile` | Готов |
| `docker-compose.yml` (backend + model, без Postgres) | Готов |
| Переменная `PORT` для uvicorn (облако) | Учтена в образе |

## Что нужно сделать перед продом

1. **Секреты**  
   - `SESSION_SECRET` — случайная строка (не `change-me-in-production`).  
   - При Postgres: `DATABASE_URL` (например `postgres://user:pass@host:5432/dbname`).

2. **Связка Node → Python**  
   - В окружении бэкенда: `MODEL_SERVICE_URL=https://<ваш-python-хост>` (внутри Docker Compose: `http://model:8001`).

3. **Файлы моделей**  
   - **CrabNet:** `model_service/weights/UnnamedModel.pth` — должен попасть в образ (уже под `COPY model_service/`).  
   - **RandomForest:** `curie_model.joblib` и `curie_scaler.joblib` в **корне репозитория** (рядом с `train_curie_three_versions.py`). Если файлов нет — RF вернёт 503; CrabNet работает.  
   - Если pickle sklearn несовместим — переобучите RF или используйте то же окружение sklearn, что при сохранении.

4. **База данных**  
   - Полный функционал (логин, разметка): поднимите Postgres, **не** ставьте `SKIP_DB=1`, задайте `DATABASE_URL`.  
   - Только предсказания: можно `SKIP_DB=1` (как в `docker-compose` по умолчанию).

5. **Сборка перед пушем**  
   - В CI или на сервере: `cd backend && npm ci && npm run build`.  
   - Образ backend делает это сама в `docker/backend.Dockerfile`.

## Команды

### Локально без Docker

```text
Терминал A: cd model_service && pip install -r requirements.txt && uvicorn main:app --host 127.0.0.1 --port 8001
Терминал B: cd backend && npm run build && npm run start:no-db
# при необходимости: $env:MODEL_SERVICE_URL="http://127.0.0.1:8001"
```

### Docker Compose (рекомендуется проверить перед облаком)

```bash
docker compose up --build
```

Откройте http://localhost:3000 — API предсказаний проксируется на сервис моделей.

### Облако (Railway / Render / VPS)

- Два сервиса: **Python** (команда uvicorn, порт из `PORT`) и **Node** (`node dist/server.js`, порт из `PORT`).  
- В Node задать `MODEL_SERVICE_URL` на публичный или внутренний URL Python-сервиса.  
- Для Postgres — addon БД и `DATABASE_URL`; убрать `SKIP_DB`.

## Типичные ошибки

- **ECONNREFUSED :5432** — не запущен Postgres и не используется `SKIP_DB=1` / `npm run start:no-db`.  
- **Sklearn / joblib** — несовместимость версий; см. выше.  
- **Docker: import train_curie** — образ собирать только из **корня** с `-f docker/model-service.Dockerfile`, не из каталога `model_service` в одиночку.
