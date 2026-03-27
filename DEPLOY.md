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
   - **RandomForest:** нужны **`curie_model.joblib`** и **`curie_scaler.joblib`**. В Docker они ищутся в **`/app/`** (рядом с `train_curie_three_versions.py`).  
     - **Локально / Compose:** положите оба файла в **корень репозитория** и смонтируйте в контейнер (как в `docker-compose.yml`) **или** раскомментируйте строку `COPY curie_model.joblib curie_scaler.joblib /app/` в `docker/model-service.Dockerfile` и закоммитьте файлы в репо.  
     - **Render Free и другие облака:** без этих файлов в образе RF даст **503** и `FileNotFoundError: ... '/app/curie_model.joblib'` — это **не** ошибка sklearn, а отсутствие артефактов. **Платный persistent disk не обязателен:** закоммитьте `curie_model.joblib` и `curie_scaler.joblib` в репозиторий и в `docker/model-service.Dockerfile` оставьте строку `COPY curie_model.joblib curie_scaler.joblib /app/` — файлы попадут в образ при сборке на Render (бесплатный инстанс подходит). **Persistent disk** (Render Starter+) — опция, если не хотите хранить joblib в git: смонтировать диск и задать `CURIE_MODEL_PATH` / `CURIE_SCALER_PATH`.  
   - Если pickle sklearn несовместим — переобучите RF или используйте то же окружение sklearn, что при сохранении.  
     Для этого при сборке Docker-образа model-service используйте `USE_LEGACY_SKLEARN=1` (sklearn==1.0.2).

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

Перед `docker compose up` положите в корень репозитория файлы:
- `curie_model.joblib`
- `curie_scaler.joblib`

В `docker-compose.yml` они монтируются в model-service как:
- `/app/curie_model.joblib`
- `/app/curie_scaler.joblib`

### Облако (Railway / Render / VPS)

- Два сервиса: **Python** (команда uvicorn, порт из `PORT`) и **Node** (`node dist/server.js`, порт из `PORT`).  
- В Node задать `MODEL_SERVICE_URL` на публичный или внутренний URL Python-сервиса.  
- Для Postgres — addon БД и `DATABASE_URL`; убрать `SKIP_DB`.

## Типичные ошибки

- **ECONNREFUSED :5432** — не запущен Postgres и не используется `SKIP_DB=1` / `npm run start:no-db`.  
- **Sklearn / joblib** — несовместимость версий; см. выше.  
- **Docker: import train_curie** — образ собирать только из **корня** с `-f docker/model-service.Dockerfile`, не из каталога `model_service` в одиночку.
