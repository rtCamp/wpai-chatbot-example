# Shared base include libraries.
FROM node:22-alpine AS base
RUN apk update && apk add --no-cache libc6-compat

FROM base AS installer
WORKDIR /app
RUN npm install -g turbo

# Copy only minimal files for turbo prune
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
COPY apps/rag/package.json ./apps/rag/package.json
COPY apps/rag/tsconfig.json ./apps/rag/tsconfig.json

RUN turbo prune "@wpai-chatbot/api" "@wpai-chatbot/rag" --docker

# Install deps from turbo
FROM base AS build
WORKDIR /app
COPY --from=installer /app/out/json/ ./
RUN --mount=type=cache,target=/root/.npm npm install
COPY --from=installer /app/out/full/ ./

# Copy required source and prisma directories
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/src ./apps/api/src
COPY apps/rag/src ./apps/rag/src

# Generate Prisma Client
RUN cd apps/api && npx prisma generate

# Build the project and its dependencies in correct order
RUN npm run build -w @wpai-chatbot/rag && npm run build -w @wpai-chatbot/api

# Runner stage
FROM base AS runner
WORKDIR /app

# Install global dependencies
RUN npm install -g @nestjs/cli prisma

# Don't run production as root
RUN addgroup --system --gid 1001 expressjs
RUN adduser --system --uid 1001 expressjs
COPY --from=build --chown=expressjs:expressjs /app .
USER expressjs
