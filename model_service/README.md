Python-сервис для предсказания температуры Кюри (T_C) по химической формуле.

Структура:
- main.py — точка входа (FastAPI/Flask), описывает HTTP-эндпоинты.
- model_loader.py — загрузка модели и скейлера, функция предсказания по списку формул.
- schemas.py — Pydantic-модели (схемы запросов/ответов), если используется FastAPI.
- requirements.txt — зависимости сервиса.

Пример запуска (FastAPI):
- Установить зависимости: `pip install -r requirements.txt`
- Запустить: `uvicorn main:app --reload --port 8001`

После запуска сервис будет принимать POST-запросы на /predict с телом:
{ "formulas": ["Fe3O4", "Nd2Fe14B"] }

