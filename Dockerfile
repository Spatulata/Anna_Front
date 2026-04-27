# ============================================================
# Stage 1: Build React
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps

COPY . .
RUN npm run build

# ============================================================
# Stage 2: Serve static (без nginx — через serve)
# ============================================================
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/build ./build

ENV PORT=4000
EXPOSE 4000

# При старте: генерируем config.js из ENV, затем запускаем serve
CMD sh -c 'echo "window.__ENV__={API_URL:\"${API_URL:-}\"}" > /app/build/config.js && echo "Runtime config: API_URL=${API_URL:-not set}" && serve -s build -l ${PORT:-4000}'
