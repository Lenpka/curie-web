# Сборка из корня репозитория:
#   docker build -f docker/model-service.Dockerfile -t curie-model .
#
# RandomForest со старым joblib (обучение на sklearn 1.0.x):
#   docker build -f docker/model-service.Dockerfile --build-arg USE_LEGACY_SKLEARN=1 --build-arg PYTHON_VERSION=3.10-slim -t curie-model .
#
# Нужны train_curie_three_versions.py (корень) и model_service/; веса CrabNet — model_service/weights/
# Для RF добавьте в образ curie_model.joblib и curie_scaler.joblib (см. Dockerfile COPY ниже).

ARG PYTHON_VERSION=3.11-slim
FROM python:${PYTHON_VERSION}

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

ARG USE_LEGACY_SKLEARN=0

COPY train_curie_three_versions.py /app/train_curie_three_versions.py
COPY model_service/requirements.txt /app/model_service/requirements.txt
COPY model_service/requirements-sklearn102.txt /app/model_service/requirements-sklearn102.txt

RUN if [ "$USE_LEGACY_SKLEARN" = "1" ]; then \
      pip install --no-cache-dir -r /app/model_service/requirements-sklearn102.txt; \
    else \
      pip install --no-cache-dir -r /app/model_service/requirements.txt; \
    fi

COPY model_service/ /app/model_service/

# RandomForest: положите curie_model.joblib и curie_scaler.joblib в корень репо и раскомментируйте:
# COPY curie_model.joblib curie_scaler.joblib /app/

ENV PYTHONPATH=/app
ENV CRABNET_FORCE_CPU=1
WORKDIR /app/model_service

EXPOSE 8001

CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}"]
