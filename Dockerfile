# Base image
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Production runner stage
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src

EXPOSE 3000

CMD ["node", "src/main/server.js"]
