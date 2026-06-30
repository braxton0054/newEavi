FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore ./
RUN npm ci --prefer-offline --no-audit --loglevel error
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/.next ./.next
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs server.ts ./
COPY --chown=nodejs:nodejs public ./public
USER 1001
EXPOSE 4000
CMD ["node", "server.ts"]
