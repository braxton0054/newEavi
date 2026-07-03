FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl python3 make g++
COPY package*.json .gitignore ./
RUN npm install --legacy-peer-deps --loglevel error
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.mjs ./server.mjs
COPY --from=builder /app/prisma ./prisma
EXPOSE 4000
CMD ["sh", "-c", "npx prisma db push && npm start"]
