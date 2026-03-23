# Сборка из корня репозитория:
#   docker build -f docker/backend.Dockerfile -t curie-backend .
#
# После сборки: node dist/server.js + статика public/
FROM node:20-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/server.js"]
