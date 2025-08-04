FROM node:22-alpine AS base_image

# Don't run production as root
RUN addgroup --system --gid 1001 nextjs && \
	adduser --system --uid 1001 --ingroup nextjs nextjs

FROM base_image AS workspace

RUN npm install -g turbo

USER nextjs

WORKDIR /app

COPY --chown=nextjs:nextjs . .
RUN turbo prune "@wpai-chatbot/dashboard" --docker

WORKDIR /app/out/full

FROM base_image AS application

USER nextjs
WORKDIR /app

# Cache the dependencies to speed up subsequent builds
COPY --from=workspace /app/out/json/ .
RUN --mount=type=cache,uid=1001,gid=1001,target=/home/nextjs/.npm npm install --workspaces --include-workspace-root

COPY --from=workspace /app/out/full/ .

RUN npm run build --workspace="@wpai-chatbot/dashboard"

# Using scratch to minimize image size
FROM base_image AS runtime

USER nextjs
COPY --from=application /app /app
WORKDIR /app

CMD ["sh", "-c", "if [ \"$NODE_ENV\" != \"production\" ]; then cd apps/dashboard && npm run dev; else cd apps/dashboard && npm start; fi"]
