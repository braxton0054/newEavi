FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore ./
RUN npm ci --prefer-offline --no-audit --loglevel error
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server.mjs ./server.mjs
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && npm start"]
