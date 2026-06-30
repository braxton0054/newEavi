# Build stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .gitignore ./
RUN npm ci --prefer-offline --no-audit --loglevel error

# Build stage 2: Application
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Build stage 3: Production image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Add runtime dependencies
RUN apk add --no-cache dumb-init bash curl

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/lib/whatsapp ./src/lib/whatsapp

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 4000

ENV NEXT_TELEMETRY_DISABLED=1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.ts"]