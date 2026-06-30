FROM node:22-alpine
WORKDIR /app
COPY package*.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore ./
RUN npm ci --prefer-offline --no-audit --loglevel error
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["node", "server.ts"]