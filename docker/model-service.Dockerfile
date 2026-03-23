# Сборка из корня репозитория:
#   docker build -f docker/model-service.Dockerfile -t curie-model .
#
# Нужны train_curie_three_versions.py (корень) и model_service/; веса CrabNet — model_service/weights/
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

COPY train_curie_three_versions.py /app/train_curie_three_versions.py
COPY model_service/requirements.txt /app/model_service/requirements.txt
RUN pip install --no-cache-dir -r /app/model_service/requirements.txt

COPY model_service/ /app/model_service/

ENV PYTHONPATH=/app
ENV CRABNET_FORCE_CPU=1
WORKDIR /app/model_service

EXPOSE 8001

# Railway/Render подставляют PORT; локально по умолчанию 8001
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8001}"]
