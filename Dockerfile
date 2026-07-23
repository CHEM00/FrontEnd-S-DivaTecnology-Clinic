# frontend/Dockerfile
# Node 22 LTS: Astro 5 con Vite 7 requiere Node >= 20.19.
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
# npm ci: instala exactamente el lockfile; npm install podía resolver
# versiones nuevas en cada build y romper el deploy sin cambiar código.
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Run
FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/dist/server ./dist/server
COPY --from=builder /app/dist/client ./dist/client
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
